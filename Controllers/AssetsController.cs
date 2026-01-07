using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VotVAssets.Models;

namespace VotVAssets.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AssetsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AssetsController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/Assets
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Asset>>> GetAssets(
        ItemEnum? Item = null,
        TypeEnum? Type = null,
        long? OwnerId = null,
        long? AuthorId = null,
        string? Name = null)
    {
        var query = _context.Assets.AsQueryable();

        if (Item.HasValue)
            query = query.Where(a => a.Item == Item.Value);
        if (Type.HasValue)
            query = query.Where(a => a.Type == Type.Value);
        if (OwnerId.HasValue)
            query = query.Where(a => a.OwnerId == OwnerId.Value);
        if (AuthorId.HasValue)
            query = query.Where(a => a.AuthorId == AuthorId.Value);
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
    public async Task<ActionResult<Asset>> PostAsset(Asset asset)
    {
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
}