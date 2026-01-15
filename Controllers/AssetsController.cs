using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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
    public async Task<ActionResult<IEnumerable<Asset>>> GetAssets(
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

        return await query.ToListAsync();
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
    public async Task<IActionResult> PutAsset(long id, Asset asset)
    {
        if (id != asset.Id) return BadRequest();

        _context.Entry(asset).State = EntityState.Modified;

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
            asset.Filename = file;
        else
            return BadRequest(new { error = "A file is required." });

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

        _context.Assets.Remove(asset);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private bool AssetExists(long id)
    {
        return _context.Assets.Any(e => e.Id == id);
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
        var rootPath = _environment.ContentRootPath;
        var uploadFolder = Path.Combine(rootPath, "wwwroot", "uploads", "files");


        if (file == null) return null;
        var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
        var fullPath = Path.Combine(uploadFolder, fileName);

        await using (var stream = new FileStream(fullPath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        return fileName;
    }
}