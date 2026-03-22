namespace VotVAssets.Controllers;

using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VotVAssets.Models;

[Route("api/[controller]")]
[ApiController]
public class EditsController(IWebHostEnvironment environment, ApplicationDbContext context, UserManager<IdentityUser> userManager) : ControllerBase
{
    [Authorize(Roles = "Admin")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    [HttpGet]
    public async Task<ActionResult> GetEdits()
    {
        var edits = await context.Edits
            .AsQueryable()
            .OrderBy(e => e.CreatedAt)
            .ToListAsync();

        var assetIds = edits.Where(e => e.Table == Table.Asset).Select(e => e.TargetId).ToList();
        var artistIds = edits.Where(e => e.Table == Table.Artist).Select(e => e.TargetId).ToList();

        var assets = await context.Assets
            .Include(a => a.Artist)
            .Include(a => a.Tags)
            .Where(a => assetIds.Contains(a.Id))
            .ToDictionaryAsync(a => a.Id);

        var artists = await context.Artists
            .Where(a => artistIds.Contains(a.Id))
            .ToDictionaryAsync(a => a.Id);

        var result = edits.Select(edit => new
        {
            edit.Id,
            edit.SubmittedById,
            edit.Table,
            edit.CreatedAt,
            changes = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(edit.Changes),
            target = edit.Table == Table.Asset
                ? (object?)assets.GetValueOrDefault(edit.TargetId)
                : artists.GetValueOrDefault(edit.TargetId)
        });

        return Ok(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("{id}/approve")]
    public async Task<ActionResult> Approve(long id)
    {
        var edit = await context.Edits.FindAsync(id);
        if (edit == null) return NotFound();

        var changes = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(edit.Changes);

        if (edit.Table == Table.Asset)
        {
            var asset = await context.Assets
                .Include(a => a.Tags)
                .FirstOrDefaultAsync(a => a.Id == edit.TargetId);
            if (asset == null) return NotFound();

            if (changes.TryGetValue("name", out var name))
                asset.Name = name.GetString()!;

            if (changes.TryGetValue("description", out var description))
                asset.Description = description.GetString();

            if (changes.TryGetValue("source", out var source))
                asset.Source = source.GetString();

            if (changes.TryGetValue("artistId", out var artistId))
                asset.ArtistId = artistId.GetInt64();

            if (changes.TryGetValue("type", out var type))
                asset.Type = (TypeEnum)type.GetInt32();

            if (changes.TryGetValue("tags", out var tagsElement))
            {
                var tagNames = tagsElement.Deserialize<string[]>() ?? [];
                asset.Tags.Clear();
                foreach (var tagName in tagNames)
                {
                    var tag = await context.Tags.FirstOrDefaultAsync(t => t.Name == tagName)
                              ?? new Tag { Name = tagName };
                    asset.Tags.Add(tag);
                }
            }

            if (changes.TryGetValue("thumbnail", out var thumbnail))
            {
                var tempPath = Path.Combine(environment.ContentRootPath, "wwwroot", "temp_uploads", "thumbnails",
                    thumbnail.GetString()!);
                var finalPath = Path.Combine(environment.ContentRootPath, "wwwroot", "uploads", "thumbnails",
                    thumbnail.GetString()!);
                DeleteFile(Path.Combine(environment.ContentRootPath, "wwwroot", "uploads", "thumbnails",
                    asset.Thumbnail ?? ""));
                System.IO.File.Move(tempPath, finalPath);
                asset.Thumbnail = thumbnail.GetString();
            }

            if (changes.TryGetValue("preview", out var preview))
            {
                var tempPath = Path.Combine(environment.ContentRootPath, "wwwroot", "temp_uploads", "previews",
                    preview.GetString()!);
                var finalPath = Path.Combine(environment.ContentRootPath, "wwwroot", "uploads", "previews",
                    preview.GetString()!);
                DeleteFile(Path.Combine(environment.ContentRootPath, "wwwroot", "uploads", "previews",
                    asset.Preview ?? ""));
                System.IO.File.Move(tempPath, finalPath);
                asset.Preview = preview.GetString();
            }
        }
        else
        {
            var artist = await context.Artists.FindAsync(edit.TargetId);
            if (artist == null) return NotFound();

            if (changes.TryGetValue("name", out var name))
                artist.Name = name.GetString()!;

            if (changes.TryGetValue("description", out var description))
                artist.Description = description.GetString();

            if (changes.TryGetValue("socials", out var socials))
                artist.Socials = socials.Deserialize<string[]>();

            if (changes.TryGetValue("pfp", out var pfp))
            {
                var tempPath = Path.Combine(environment.ContentRootPath, "wwwroot", "temp_uploads", "avatars",
                    pfp.GetString()!);
                var finalPath = Path.Combine(environment.ContentRootPath, "wwwroot", "uploads", "avatars",
                    pfp.GetString()!);
                DeleteFile(Path.Combine(environment.ContentRootPath, "wwwroot", "uploads", "avatars",
                    artist.Pfp ?? ""));
                System.IO.File.Move(tempPath, finalPath);
                artist.Pfp = pfp.GetString();
            }
        }

        context.Edits.Remove(edit);
        await context.SaveChangesAsync();
        return Ok();
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("{id}/reject")]
    public async Task<ActionResult> Reject(long id)
    {
        var edit = await context.Edits.FindAsync(id);
        if (edit == null) return NotFound();

        var changes = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(edit.Changes);

        if (changes.TryGetValue("thumbnail", out var thumbnail))
            DeleteFile(Path.Combine(environment.ContentRootPath, "wwwroot", "temp_uploads", "thumbnails",
                thumbnail.GetString()!));

        if (changes.TryGetValue("preview", out var preview))
            DeleteFile(Path.Combine(environment.ContentRootPath, "wwwroot", "temp_uploads", "previews",
                preview.GetString()!));

        if (changes.TryGetValue("pfp", out var pfp))
            DeleteFile(
                Path.Combine(environment.ContentRootPath, "wwwroot", "temp_uploads", "avatars", pfp.GetString()!));

        context.Edits.Remove(edit);
        await context.SaveChangesAsync();
        return Ok();
    }
    
    [Authorize]
    [HttpDelete("target/{targetId}")]
    public async Task<IActionResult> DeleteEdit(long targetId)
    {
        var edit = await context.Edits
            .FirstOrDefaultAsync(e => e.TargetId == targetId && e.SubmittedById == userManager.GetUserId(User));

        if (edit == null) return NotFound();

        var changes = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(edit.Changes);

        if (changes.TryGetValue("thumbnail", out var thumbnail))
            DeleteFile(Path.Combine(environment.ContentRootPath, "wwwroot", "temp_uploads", "thumbnails", thumbnail.GetString()!));

        if (changes.TryGetValue("preview", out var preview))
            DeleteFile(Path.Combine(environment.ContentRootPath, "wwwroot", "temp_uploads", "previews", preview.GetString()!));

        if (changes.TryGetValue("pfp", out var pfp))
            DeleteFile(Path.Combine(environment.ContentRootPath, "wwwroot", "temp_uploads", "avatars", pfp.GetString()!));

        context.Edits.Remove(edit);
        await context.SaveChangesAsync();

        return NoContent();
    }



    private void DeleteFile(string filepath)
    {
        if (System.IO.File.Exists(filepath))
            System.IO.File.Delete(filepath);
    }
}