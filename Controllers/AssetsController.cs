
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SixLabors.ImageSharp;
using VotVAssets.Models;
using Asset = VotVAssets.Models.Asset;
using Image = SixLabors.ImageSharp.Image;
using SixLabors.ImageSharp.Processing;
using SixLabors.ImageSharp.PixelFormats;

namespace VotVAssets.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AssetsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _environment;
    private readonly UserManager<IdentityUser> _userManager;

    
    [HttpGet("trim-all")]
    public async void TrimEverything()
    {
        var assets = await _context.Assets.ToListAsync();
        
        foreach (var asset in assets)
        {
            if (asset.Thumbnail != null)
            {
                var thumbnailPath = Path.Combine(
                    _environment.ContentRootPath, 
                    "wwwroot", 
                    "uploads", 
                    "thumbnails",
                    asset.Thumbnail
                );
        
                TrimTransparentImage(thumbnailPath, thumbnailPath);
            }
        }
    }

    public AssetsController(IWebHostEnvironment environment, ApplicationDbContext context,
        UserManager<IdentityUser> userManager)
    {
        _environment = environment;
        _context = context;
        _userManager = userManager;
    }

    // GET: api/Assets
    //https://stackoverflow.com/a/55686482
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    [HttpGet]
    public async Task<ActionResult<IEnumerable<AssetDto>>> GetAssets(ItemEnum? Item = null)
    {
        var query = _context.Assets.AsQueryable();

        if (Item.HasValue)
            query = query.Where(a => a.Item == Item.Value);

        //https://learn.microsoft.com/en-us/dotnet/framework/data/adonet/ef/language-reference/method-based-query-syntax-examples-join-operators
        //idk why we must do a select afterward
        var joinedQuery = query.Join(
            _context.Artists,
            asset => asset.ArtistId,
            artist => artist.Id,
            (asset, artist) => new AssetDto
            {
                Id = asset.Id,
                Name = asset.Name,
                ArtistName = artist.Name,
                OwnerId = asset.OwnerId,
                ArtistId = asset.ArtistId,
                Filename = asset.Filename,
                Item = asset.Item,
                Description = asset.Description,
                Thumbnail = asset.Thumbnail,
                Source = asset.Source,
                Tags = asset.Tags,
                Type = asset.Type,
                Preview = asset.Preview,
                CreatedAt = asset.CreatedAt,
                UpdatedAt = asset.UpdatedAt
            }
        );

        return await joinedQuery.ToListAsync();
    }

    // GET: api/Assets/5
    [HttpGet("{id}")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<ActionResult<Asset>> GetAsset(long id)
    {
        var asset = await _context.Assets.FindAsync(id);

        if (asset == null) return NotFound();

        return asset;
    }

    // PUT: api/Assets/5
    // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
    [Authorize]
    [HttpPut("{id}")]
    public async Task<IActionResult> PutAsset(long id, [FromForm] Asset asset)
    {
        if (id != asset.Id) return BadRequest();

        //https://stackoverflow.com/a/56865203 goofy
        var existingAsset = await _context.Assets.AsNoTracking().FirstOrDefaultAsync(a => a.Id == id);
        if (!User.IsInRole("Admin") && existingAsset.OwnerId != _userManager.GetUserId(User)) return Unauthorized();

        _context.Entry(asset).State = EntityState.Modified;

        asset.OwnerId = existingAsset.OwnerId;
        asset.Filename = existingAsset.Filename;
       
        asset.CreatedAt = existingAsset.CreatedAt;

        var thumbnail = await HandleThumbnail(Request.Form.Files["thumbnail"]);
        if (thumbnail != null)
        {
            DeleteFile(Path.Combine(_environment.ContentRootPath, "wwwroot", "uploads", "thumbnails",
                existingAsset.Thumbnail ?? ""));
            asset.Thumbnail = thumbnail;
        }
        else
        {
            asset.Thumbnail = existingAsset.Thumbnail;
        }
        
        asset.Preview = existingAsset.Preview;

        if(Request.Form.Files["preview"] != null)
        {
            string ext = Path.GetExtension(Request.Form.Files["preview"].FileName);
            if(string.Equals(ext, ".glb", StringComparison.OrdinalIgnoreCase))
            {
                var preview = await HandlePreview(Request.Form.Files["preview"]);
                if (preview != null)
                {
                    DeleteFile(Path.Combine(_environment.ContentRootPath, "wwwroot", "uploads", "previews",
                        existingAsset.Preview ?? ""));
                    asset.Preview = preview;
                }
            }
        }
       

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!AssetExists(id)) return NotFound();

            throw;
        }

        return NoContent();
    }

    // POST: api/Assets
    // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
    [Authorize]
    [HttpPost]
    public async Task<ActionResult<Asset>> PostAsset([FromForm] Asset asset)
    {
        asset.OwnerId = _userManager.GetUserId(User);

        var thumbnail = await HandleThumbnail(Request.Form.Files["thumbnail"]);
        if (thumbnail != null)
            asset.Thumbnail = thumbnail;

        var file = await HandleFile(Request.Form.Files["file"]);

        if (file != null)
        {
            if (file == "INVALID_TYPE") return BadRequest(new { error = "Only images or .zip files allowed." });

            asset.Filename = file;
        }
        else
        {
            return BadRequest(new { error = "A file is required." });
        }

        if (asset.Item == ItemEnum.Model)
        {
            if (Request.Form.Files["preview"] != null)
            {
                string ext = Path.GetExtension(Request.Form.Files["preview"].FileName);
                if (string.Equals(ext, ".glb", StringComparison.OrdinalIgnoreCase))
                {
                    asset.Preview = await HandlePreview(Request.Form.Files["preview"]);
                }
                else
                {
                    return BadRequest(new { error = "Preview must be a .glb file." });
                }
            }
        }


        _context.Assets.Add(asset);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAsset), new { id = asset.Id }, asset);
    }

    // DELETE: api/Assets/5
    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAsset(long id)
    {
        var asset = await _context.Assets.FindAsync(id);
        if (!User.IsInRole("Admin") && asset.OwnerId != _userManager.GetUserId(User)) return Unauthorized();
        if (asset == null) return NotFound();

        _context.Assets.Remove(asset);
        await _context.SaveChangesAsync();

        DeleteFile(
            Path.Combine(_environment.ContentRootPath, "wwwroot", "uploads", "thumbnails", asset.Thumbnail ?? ""));
        DeleteFile(Path.Combine(_environment.ContentRootPath, "wwwroot", "uploads", "files", asset.Filename ?? ""));
        DeleteFile(
            Path.Combine(_environment.ContentRootPath, "wwwroot", "uploads", "previews", asset.Preview ?? ""));
        return NoContent();
    }

    private bool AssetExists(long id)
    {
        return _context.Assets.Any(e => e.Id == id);
    }

    private void DeleteFile(string filepath)
    {
        if (System.IO.File.Exists(filepath))
            System.IO.File.Delete(filepath);
    }

    private async Task<string?> HandleThumbnail(IFormFile? thumbnail)
    {
        var rootPath = _environment.ContentRootPath;
        var uploadFolder = Path.Combine(rootPath, "wwwroot", "uploads", "thumbnails");

        if (thumbnail == null) return null;
        var fileName = $"{Guid.NewGuid()}{Path.GetExtension(thumbnail.FileName)}";
        var fullPath = Path.Combine(uploadFolder, fileName);

        await using (var stream = new FileStream(fullPath, FileMode.Create))
        {
            await thumbnail.CopyToAsync(stream);
        }
        
        TrimTransparentImage(fullPath, fullPath);

        return fileName;
    }

    private async Task<string?> HandlePreview(IFormFile? preview)
    {
        var rootPath = _environment.ContentRootPath;
        var uploadFolder = Path.Combine(rootPath, "wwwroot", "uploads", "previews");

        if (preview == null) return null;
        var fileName = $"{Guid.NewGuid()}{Path.GetExtension(preview.FileName)}";
        var fullPath = Path.Combine(uploadFolder, fileName);

        await using (var stream = new FileStream(fullPath, FileMode.Create))
        {
            await preview.CopyToAsync(stream);
        }

        return fileName;
    }

    private async Task<string?> HandleFile(IFormFile? file)
    {
        if (file == null) return null;

        var rootPath = _environment.ContentRootPath;
        var uploadFolder = Path.Combine(rootPath, "wwwroot", "uploads", "files");

        var fileName = $"{Guid.NewGuid()}";

        try
        {
            using (var image = await Image.LoadAsync(file.OpenReadStream()))
            {
                fileName += ".png";
                var fullPath = Path.Combine(uploadFolder, fileName);
                await image.SaveAsPngAsync(fullPath);
                return fileName;
            }
        }
        catch
        {
            if (file.ContentType == "application/zip" ||
                file.FileName.EndsWith(".zip", StringComparison.OrdinalIgnoreCase))
            {
                fileName += ".zip";
                var fullPath = Path.Combine(uploadFolder, fileName);

                await using (var stream = new FileStream(fullPath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                return fileName;
            }

            return "INVALID_TYPE";
        }
    }

 

public void TrimTransparentImage(string inputPath, string outputPath)
{
    using var image = Image.Load<Rgba32>(inputPath);
    
    int width = image.Width;
    int height = image.Height;

    int top = 0;
    int bottom = height - 1;
    int left = 0;
    int right = width - 1;
    
    //https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/statements/jump-statements
    
    // 1 2 3 4 5
    // 6 7 8 top
    //
    //
    // 
    for (int y = 0; y < height; y++)
    {
        for (int x = 0; x < width; x++)
        {
            if (image[x, y].A > 0)
            {
                top = y;
                goto FoundTop;
            }
        }
    }
    FoundTop:
    
    //
    //
    //
    //6 7 8 bottom
    //1 2 3 4 5
    for (int y = height - 1; y >= top; y--)
    {
        for (int x = 0; x < width; x++)
        {
            if (image[x, y].A > 0)
            {
                bottom = y;
                goto FoundBottom;
            }
        }
    }
    FoundBottom:

    
    //1 2 3 4 5
    //left
    //
    //
    //
    for (int x = 0; x < width; x++)
    {
        for (int y = top; y <= bottom; y++)
        {
            if (image[x, y].A > 0)
            {
                left = x;
                goto FoundLeft;
            }
        }
    }
    FoundLeft:
    
    //5 4 3 2 1
    //        right  
    //
    //
    //
    for (int x = width - 1; x >= left; x--)
    {
        for (int y = top; y <= bottom; y++)
        {
            if (image[x, y].A > 0)
            {
                right = x;
                goto FoundRight;
            }
        }
    }
    FoundRight:
    
    
    // 0 0 0 0 0
    // left-top x x x right-top
    // x x x x x
    // left-bottom x x x right bottom
    // 0 0 0 0 0
    int cropWidth = right - left + 1;
    int cropHeight = bottom - top + 1;
    
    if (cropWidth > 0 && cropHeight > 0)
    {
        image.Mutate(ctx => ctx.Crop(new Rectangle(left, top, cropWidth, cropHeight)));
    }
    
    image.Save(outputPath);
}

}