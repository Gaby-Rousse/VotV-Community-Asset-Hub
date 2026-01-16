using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SixLabors.ImageSharp;
using VotVAssets.Models;

namespace VotVAssets.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AssetsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _environment;
    private readonly UserManager<IdentityUser> _userManager;


    public AssetsController(IWebHostEnvironment environment, ApplicationDbContext context,
        UserManager<IdentityUser> userManager)
    {
        _environment = environment;
        _context = context;
        _userManager = userManager;
    }

    // GET: api/Assets
    [HttpGet]
    public async Task<ActionResult<IEnumerable<AssetDto>>> GetAssets(
        ItemEnum? Item = null,
        TypeEnum? Type = null,
        string? OwnerId = null,
        long? ArtistId = null,
        string? Name = null)
    {
        var query = _context.Assets.AsQueryable();

        if (Item.HasValue)
            query = query.Where(a => a.Item == Item.Value);
        if (Type.HasValue)
            query = query.Where(a => a.Type == Type.Value);
        if (OwnerId != null)
            query = query.Where(a => a.OwnerId == OwnerId);
        if (ArtistId.HasValue)
            query = query.Where(a => a.ArtistId == ArtistId.Value);
        if (!string.IsNullOrEmpty(Name))
            query = query.Where(a => a.Name.Contains(Name));

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
                CreatedAt = asset.CreatedAt,
                UpdatedAt = asset.UpdatedAt
            }
        );

        return await joinedQuery.ToListAsync();
    }

    // GET: api/Assets/5
    [HttpGet("{id}")]
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
}