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
    [Authorize]
    [HttpPut("{id}")]
    public async Task<IActionResult> PutArtist(long id, [FromForm] Artist artist)
    {
        if (id != artist.Id) return BadRequest();

        //https://stackoverflow.com/a/56865203 goofy
        var existingArtist = await _context.Artists.AsNoTracking().FirstOrDefaultAsync(a => a.Id == id);
        if (!User.IsInRole("Admin") && existingArtist.OwnerId != _userManager.GetUserId(User)) return Unauthorized();

        _context.Entry(artist).State = EntityState.Modified;

        artist.OwnerId = existingArtist.OwnerId;

        var pfp = await HandlePfp(Request.Form.Files["avatar"]);
        if (pfp != null)
            artist.Pfp = pfp;

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
        if (_context.Artists.Any(a => a.Name.Trim().ToLower() == artist.Name.Trim().ToLower()))
            return BadRequest(new { error = "Artist with that username already exists" });

        artist.OwnerId = _userManager.GetUserId(User);

        var pfp = await HandlePfp(Request.Form.Files["avatar"]);
        if (pfp != null)
            artist.Pfp = pfp;

        _context.Artists.Add(artist);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetArtist), new { id = artist.Id }, artist);
    }

    // DELETE: api/Artists/5
    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteArtist(long id)
    {
        var artist = await _context.Artists.FindAsync(id);
        if (artist == null) return NotFound();

        var existingArtist = await _context.Artists.AsNoTracking().FirstOrDefaultAsync(a => a.Id == id);
        if (!User.IsInRole("Admin") && existingArtist.OwnerId != _userManager.GetUserId(User)) return Unauthorized();

        _context.Artists.Remove(artist);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private bool ArtistExists(long id)
    {
        return _context.Artists.Any(e => e.Id == id);
    }

    private async Task<string?> HandlePfp(IFormFile? avatar)
    {
        var rootPath = _environment.ContentRootPath;
        var uploadFolder = Path.Combine(rootPath, "wwwroot", "uploads", "avatars");


        if (avatar == null) return null;
        var fileName = $"{Guid.NewGuid()}{Path.GetExtension(avatar.FileName)}";
        var fullPath = Path.Combine(uploadFolder, fileName);

        await using (var stream = new FileStream(fullPath, FileMode.Create))
        {
            await avatar.CopyToAsync(stream);
        }

        return fileName;
    }
}