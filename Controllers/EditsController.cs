using VotVAssets.Models.Enums;
using VotVAssets.Services;

namespace VotVAssets.Controllers;

using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VotVAssets.Models;

[Route("api/[controller]")]
[ApiController]
public class EditsController(ApplicationDbContext context, UserManager<IdentityUser> userManager, FileService fileService) : ControllerBase
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

        Asset? editedAsset = null;
        bool wasExplicit = false;

        if (edit.Table == Table.Asset)
        {
            var asset = await context.Assets
                .Include(a => a.Tags)
                .FirstOrDefaultAsync(a => a.Id == edit.TargetId);
            if (asset == null) return NotFound();

            editedAsset = asset;
            wasExplicit = asset.Rating == ContentRating.Explicit;

            if (changes.TryGetValue("name", out var name))
                asset.Name = name.GetString()!;

            if (changes.TryGetValue("rating", out var rating))
                asset.Rating = (ContentRating)rating.GetInt32();

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
                await fileService.DeleteFileAsync($"uploads/thumbnails/{asset.Thumbnail}");
                await fileService.PromoteTempAsync("thumbnails", thumbnail.GetString()!);
                asset.Thumbnail = thumbnail.GetString();
            }

            if (changes.TryGetValue("preview", out var preview))
            {
                await fileService.DeleteFileAsync($"uploads/previews/{asset.Preview}");
                await fileService.PromoteTempAsync("previews", preview.GetString()!);
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
                await fileService.DeleteFileAsync($"uploads/avatars/{artist.Pfp}");
                await fileService.PromoteTempAsync("avatars", pfp.GetString()!);
                artist.Pfp = pfp.GetString();
            }
        }

        context.Edits.Remove(edit);
        await context.SaveChangesAsync();

        if (editedAsset != null)
            await fileService.SyncBucket(editedAsset, wasExplicit);

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
            await fileService.DeleteFileAsync($"temp_uploads/thumbnails/{thumbnail.GetString()}");

        if (changes.TryGetValue("preview", out var preview))
            await fileService.DeleteFileAsync($"temp_uploads/previews/{preview.GetString()}");

        if (changes.TryGetValue("pfp", out var pfp))
            await fileService.DeleteFileAsync($"temp_uploads/avatars/{pfp.GetString()}");

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
            await fileService.DeleteFileAsync($"temp_uploads/thumbnails/{thumbnail.GetString()}");

        if (changes.TryGetValue("preview", out var preview))
            await fileService.DeleteFileAsync($"temp_uploads/previews/{preview.GetString()}");

        if (changes.TryGetValue("pfp", out var pfp))
            await fileService.DeleteFileAsync($"temp_uploads/avatars/{pfp.GetString()}");

        context.Edits.Remove(edit);
        await context.SaveChangesAsync();

        return NoContent();
    }
}