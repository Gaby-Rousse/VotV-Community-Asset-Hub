using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VotVAssets.Models;

namespace VotVAssets.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ArtistsController(IWebHostEnvironment environment, ApplicationDbContext context, UserManager<IdentityUser> userManager) : ControllerBase
{

    [Authorize]
    [HttpPost("{id}/transfer")]
    public async Task<IActionResult> TransferOwnership(long id, [FromForm] string newOwnerId)
    {
        var artist = await context.Artists.FindAsync(id);
        if (artist == null) return NotFound();
        if (!User.IsInRole("Admin") && artist.OwnerId != userManager.GetUserId(User)) return Unauthorized();

        var newOwner = await userManager.FindByIdAsync(newOwnerId);
        if (newOwner == null) return BadRequest(new { error = "User not found." });

        artist.OwnerId = newOwnerId;
        await context.SaveChangesAsync();
        return Ok();
    }
    
    // GET: api/Artists
    [HttpGet]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<ActionResult<IEnumerable<Artist>>> GetArtists(string? ownerId, string? search, int page = 1)
    {
        const int artistsPerPage = 40;
        var query = context.Artists
            .Select(a => new Artist
            {
                Id = a.Id,
                Name = a.Name,
                OwnerId = a.OwnerId,
                Description = a.Description,
                Socials = a.Socials,
                Pfp = a.Pfp,
                AssetCount = a.Assets.Count()
            });
            
        if (!string.IsNullOrWhiteSpace(ownerId))
            query = query.Where(a => a.OwnerId == ownerId);
        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(a => a.Name.Contains(search));
        
        var totalCount = await query.CountAsync();
        
        var assets = await query
            .Skip((page - 1) * artistsPerPage)
            .Take(artistsPerPage)
            .ToListAsync();
        
        return Ok(new
        {
            data = assets,
            totalCount,
            page,
            pageSize = artistsPerPage,
            totalPages = (int)Math.Ceiling((double)totalCount / artistsPerPage)
        });
    }

    // GET: api/Artists/5
    [HttpGet("{id}")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<ActionResult<Artist>> GetArtist(long id, bool seeChanges = false)
    {
        var artist = await context.Artists.FindAsync(id);

        if (artist == null) return NotFound();

        if (seeChanges)
        {
            var edit = await context.Edits
                .Where(edit => edit.TargetId == id && edit.SubmittedById == userManager.GetUserId(User) && edit.Table == Table.Artist)
                .FirstOrDefaultAsync();

            if (edit != null)
            {
                var dict = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(edit.Changes);

                if (dict.TryGetValue("name", out var name))
                    artist.Name = name.GetString();

                if (dict.TryGetValue("description", out var description))
                    artist.Description = description.GetString();

                if (dict.TryGetValue("socials", out var socials))
                    artist.Socials = socials.Deserialize<string[]>();

                if (dict.TryGetValue("pfp", out var pfp))
                    artist.Pfp = $"temp/{pfp.GetString()}";
            }
        }

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
        var existingArtist = await context.Artists.AsNoTracking().FirstOrDefaultAsync(a => a.Id == id);
        if (!User.IsInRole("Admin") && existingArtist.OwnerId != userManager.GetUserId(User))
        {
            var changes = new Dictionary<string, object?>();

            if (artist.Name != existingArtist.Name)
                changes["name"] = artist.Name;
            
            if (artist.Description != existingArtist.Description)
                changes["description"] = artist.Description;
            
            if (artist.Socials != existingArtist.Socials)
                changes["socials"] = artist.Socials;
            
            string newAvatar = await HandlePfp(Request.Form.Files["avatar"], true);
            if (newAvatar != null)
            {
                changes["pfp"] = newAvatar;
            }
            
            if (changes.Count == 0)
                return NoContent();
            
            var pendingEdit = await context.Edits
                .FirstOrDefaultAsync(e => 
                    e.TargetId == existingArtist.Id && 
                    e.Table == Table.Artist && 
                    e.SubmittedById == userManager.GetUserId(User));
            
            if (pendingEdit != null)
            {
                var pendingChanges = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(pendingEdit.Changes);

                if (changes.ContainsKey("pfp"))
                {
                    if (pendingChanges.ContainsKey("pfp"))
                    {
                        pendingChanges.TryGetValue("pfp", out JsonElement oldPfp);
                        DeleteFile(Path.Combine(environment.ContentRootPath, "wwwroot", "temp_uploads", "avatars", oldPfp.GetString() ?? ""));
                    }
                }
                else if (pendingChanges.ContainsKey("pfp"))
                {
                    changes["pfp"] = pendingChanges["pfp"];
                }

                pendingEdit.Changes = JsonSerializer.Serialize(changes);
            }
            else
            {
                pendingEdit = new Edit
                {
                    SubmittedById = userManager.GetUserId(User)!,
                    Table = Table.Artist,
                    TargetId = existingArtist.Id,
                    Changes = JsonSerializer.Serialize(changes)
                };

                context.Edits.Add(pendingEdit);
            }
            
            await context.SaveChangesAsync();

            return NoContent();
        }

        context.Entry(artist).State = EntityState.Modified;

        artist.OwnerId = existingArtist.OwnerId;

        var pfp = await HandlePfp(Request.Form.Files["avatar"]);
        if (pfp != null)
        {
            artist.Pfp = pfp;
            DeleteFile(
                Path.Combine(environment.ContentRootPath, "wwwroot", "uploads", "avatars", existingArtist.Pfp ?? ""));
        }
        else
        {
            artist.Pfp = existingArtist.Pfp;
        }

        try
        {
            await context.SaveChangesAsync();
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
        if (context.Artists.Any(a => a.Name.Trim().ToLower() == artist.Name.Trim().ToLower()))
            return BadRequest(new { error = "Artist with that username already exists" });

        artist.OwnerId = userManager.GetUserId(User);

        var pfp = await HandlePfp(Request.Form.Files["avatar"]);
        if (pfp != null)
            artist.Pfp = pfp;

        context.Artists.Add(artist);
        await context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetArtist), new { id = artist.Id }, artist);
    }

    // DELETE: api/Artists/5
    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteArtist(long id)
    {
        var artist = await context.Artists.FindAsync(id);
        if (artist == null) return NotFound();

        var existingArtist = await context.Artists.AsNoTracking().FirstOrDefaultAsync(a => a.Id == id);
        if (!User.IsInRole("Admin") && existingArtist.OwnerId != userManager.GetUserId(User)) return Unauthorized();
        
        var edits = await context.Edits
            .Where(e => e.TargetId == id && e.Table == Table.Artist)
            .ToListAsync();

        foreach (var edit in edits)
        {
            var changes = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(edit.Changes);
    
            if (changes.TryGetValue("pfp", out var pfp))
                DeleteFile(Path.Combine(environment.ContentRootPath, "wwwroot", "temp_uploads", "avatars", pfp.GetString()!));
        }

        context.Edits.RemoveRange(edits);

        context.Artists.Remove(artist);

        var assetsToUpdate = context.Assets.Where(a => a.ArtistId == existingArtist.Id).ToList();

        foreach (var asset in assetsToUpdate)
            //server id = 30
            asset.ArtistId = 30;

        await context.SaveChangesAsync();

        DeleteFile(
            Path.Combine(environment.ContentRootPath, "wwwroot", "uploads", "avatars", existingArtist.Pfp ?? ""));

        return NoContent();
    }

    private bool ArtistExists(long id)
    {
        return context.Artists.Any(e => e.Id == id);
    }

    private async Task<string?> HandlePfp(IFormFile? avatar, bool temp = false)
    {
        var rootPath = environment.ContentRootPath;
        var uploadFolder = Path.Combine(rootPath, "wwwroot", temp ? "temp_uploads" : "uploads", "avatars");


        if (avatar == null) return null;
        var fileName = $"{Guid.NewGuid()}{Path.GetExtension(avatar.FileName)}";
        var fullPath = Path.Combine(uploadFolder, fileName);

        await using (var stream = new FileStream(fullPath, FileMode.Create))
        {
            await avatar.CopyToAsync(stream);
        }

        return fileName;
    }

    private void DeleteFile(string filepath)
    {
        if (System.IO.File.Exists(filepath))
            System.IO.File.Delete(filepath);
    }
}