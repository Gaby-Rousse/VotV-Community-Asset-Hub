using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VotVAssets.Models;

namespace VotVAssets.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ArtistsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _environment;
    private readonly UserManager<IdentityUser> _userManager;

    public ArtistsController(IWebHostEnvironment environment, ApplicationDbContext context,
        UserManager<IdentityUser> userManager)
    {
        _environment = environment;
        _context = context;
        _userManager = userManager;
    }

    // GET: api/Artists
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Artist>>> GetArtists()
    {
        return await _context.Artists.ToListAsync();
    }

    // GET: api/Artists/5
    [HttpGet("{id}")]
    public async Task<ActionResult<Artist>> GetArtist(long id)
    {
        var artist = await _context.Artists.FindAsync(id);

        if (artist == null) return NotFound();

        return artist;
    }

    // PUT: api/Artists/5
    // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
    [HttpPut("{id}")]
    public async Task<IActionResult> PutArtist(long id, Artist artist)
    {
        if (id != artist.Id) return BadRequest();

        _context.Entry(artist).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!ArtistExists(id)) return NotFound();

            throw;
        }

        return NoContent();
    }

    // POST: api/Artists
    // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
    [Authorize]
    [HttpPost]
    public async Task<ActionResult<Artist>> PostArtist([FromForm] Artist artist)
    {
        var rootPath = _environment.ContentRootPath;
        var uploadFolder = Path.Combine(rootPath, "wwwroot", "uploads", "avatars");

        var avatar = Request.Form.Files["avatar"];

        if (avatar != null)
        {
            var fileName = $"{Guid.NewGuid()}{Path.GetExtension(avatar.FileName)}";
            var fullPath = Path.Combine(uploadFolder, fileName);

            await using (var stream = new FileStream(fullPath, FileMode.Create))
            {
                await avatar.CopyToAsync(stream);
            }

            artist.Pfp = fileName;
        }

        artist.OwnerId = _userManager.GetUserId(User);

        _context.Artists.Add(artist);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetArtist), new { id = artist.Id }, artist);
    }

    // DELETE: api/Artists/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteArtist(long id)
    {
        var artist = await _context.Artists.FindAsync(id);
        if (artist == null) return NotFound();

        _context.Artists.Remove(artist);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private bool ArtistExists(long id)
    {
        return _context.Artists.Any(e => e.Id == id);
    }
}