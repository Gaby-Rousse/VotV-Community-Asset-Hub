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
using VotVAssets.Models.Enums;

namespace VotVAssets.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AssetsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _environment;
    private readonly UserManager<IdentityUser> _userManager;


    [Authorize(Roles = "Admin")]
    [HttpGet("trim-all")]
    public async Task<ActionResult> TrimEverything()
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

        return Ok("Trimmed everything successfully.");
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("parse-all")]
    public async Task<ActionResult> ParseEverything()
    {
        var assets = await _context.Assets.ToListAsync();

        foreach (var asset in assets)
        {
            if (asset.RawSize == null)
            {
                asset.RawSize = await HandleFilesize(asset.Filename);
                _context.Entry(asset).State = EntityState.Modified;
            }
        }

        await _context.SaveChangesAsync();
        return Ok("Added size to files.");
    }


    public AssetsController(IWebHostEnvironment environment, ApplicationDbContext context,
        UserManager<IdentityUser> userManager)
    {
        _environment = environment;
        _context = context;
        _userManager = userManager;
    }

    // GET: api/Assets
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    [HttpGet]
    public async Task<ActionResult<object>> GetAssets(
        ItemEnum? item = null,
        int? type = null,
        string? search = null,
        SearchBy searchBy = SearchBy.Name,
        string? tags = null,
        SortBy sort = SortBy.Alphabetical,
        bool reverse = false,
        string? ownerId = null,
        int page = 1)
    {
        const int assetsPerPage = 40;

        var query = _context.Assets
            .Include(a => a.Artist)
            .Include(a => a.Tags)
            .AsQueryable();

        if (item.HasValue)
            query = query.Where(a => a.Item == item.Value);

        if (!string.IsNullOrWhiteSpace(search))
            switch (searchBy)
            {
                case SearchBy.Name:
                    query = query.Where(a => a.Name.Contains(search));
                    break;
                case SearchBy.Artist:
                    query = query.Where(a => a.Artist!.Name.Contains(search));
                    break;
            }


        if (!string.IsNullOrWhiteSpace(ownerId))
            query = query.Where(a => a.OwnerId == ownerId);

        if (type.HasValue && type != -1)
            query = query.Where(a => (int?)a.Type == (int)type);

        if (!string.IsNullOrWhiteSpace(tags))
        {
            var tagList = tags.Split(' ', StringSplitOptions.RemoveEmptyEntries)
                .Select(t => t.ToLower().Trim())
                .ToList();
            foreach (var tag in tagList)
                query = query.Where(a => a.Tags.Any(t => t.Name == tag));
        }

        switch (sort)
        {
            case SortBy.Date:
                query = reverse ? query.OrderBy(a => a.CreatedAt) : query.OrderByDescending(a => a.CreatedAt);
                break;
            case SortBy.Size:
                query = reverse ? query.OrderBy(a => a.RawSize) : query.OrderByDescending(a => a.RawSize);
                break;
            default:
                query = reverse ? query.OrderByDescending(a => a.Name) : query.OrderBy(a => a.Name);
                break;
        }

        var totalCount = await query.CountAsync();

        var assets = await query
            .Skip((page - 1) * assetsPerPage)
            .Take(assetsPerPage)
            .ToListAsync();

        return Ok(new
        {
            data = assets,
            totalCount,
            page,
            pageSize = assetsPerPage,
            totalPages = (int)Math.Ceiling((double)totalCount / assetsPerPage)
        });
    }

    // GET: api/Assets/5
    [HttpGet("{id}")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<ActionResult<Asset>> GetAsset(long id)
    {
        var asset = await _context.Assets
            .Where(a => a.Id == id)
            .Include(a => a.Artist)
            .Include(a => a.Tags)
            .FirstOrDefaultAsync();

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
            if (thumbnail == "INVALID_TYPE")
                return BadRequest(new { error = "Only images are allowed for thumbnail." });
            DeleteFile(Path.Combine(_environment.ContentRootPath, "wwwroot", "uploads", "thumbnails",
                existingAsset.Thumbnail ?? ""));
            asset.Thumbnail = thumbnail;
        }
        else
        {
            asset.Thumbnail = existingAsset.Thumbnail;
        }

        asset.Preview = existingAsset.Preview;

        if (Request.Form.Files["preview"] != null)
        {
            string ext = Path.GetExtension(Request.Form.Files["preview"].FileName);
            if (string.Equals(ext, ".glb", StringComparison.OrdinalIgnoreCase))
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
        {
            if (thumbnail == "INVALID_TYPE")
                return BadRequest(new { error = "Only images are allowed for thumbnail." });
            asset.Thumbnail = thumbnail;
        }


        var fileName = await HandleFile(Request.Form.Files["file"]);

        if (fileName != null)
        {
            if (fileName == "INVALID_TYPE") return BadRequest(new { error = "Only images or .zip files allowed." });

            asset.Filename = fileName;
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

        asset.RawSize = await HandleFilesize(fileName);

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
        if (asset == null) return NotFound();
        if (!User.IsInRole("Admin") && asset.OwnerId != _userManager.GetUserId(User)) return Unauthorized();

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

        try
        {
            var info = await Image.IdentifyAsync(thumbnail.OpenReadStream());
        }
        catch (Exception)
        {
            return "INVALID_TYPE";
        }

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

    private async Task<long?> HandleFilesize(string fileName)
    {
        var rootPath = _environment.ContentRootPath;
        var path = Path.Combine(rootPath, "wwwroot", "uploads", "files", fileName);
        long length = new System.IO.FileInfo(path).Length;
        return length;
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