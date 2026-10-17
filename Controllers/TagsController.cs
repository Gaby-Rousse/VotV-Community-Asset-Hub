using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VotVAssets.Models;
using System.IO.Compression;
using Microsoft.AspNetCore.Http.Features;
using VotVAssets.Models.Enums;
using VotVAssets.Services;

namespace VotVAssets.Controllers;

[Route("api/[controller]")]
[ApiController]
public class TagsController(FileService fileService, IWebHostEnvironment environment, ApplicationDbContext context) : ControllerBase
{
 // GET: api/Tags
[HttpGet]
public async Task<ActionResult> GetTags(
    string? prefix = null,
    ItemEnum? item = null,
    string? search = null,
    SortBy sort = SortBy.Alphabetical,
    bool reverse = false,
    int page = 1,
    int tagsPerPage = 50)
{
    page = Math.Max(1, page);
    tagsPerPage = Math.Clamp(tagsPerPage, 1, 200);

    var hasPrefix = !string.IsNullOrWhiteSpace(prefix);

    if (!hasPrefix)
        item = null;

    var query = context.Tags.AsQueryable();

    if (!string.IsNullOrWhiteSpace(prefix))
        query = query.Where(t => t.Name.StartsWith(prefix.ToLower().Trim()));

    if (!string.IsNullOrWhiteSpace(search))
        query = query.Where(t => t.Name.Contains(search.ToLower().Trim()));

    var reworkedQuery = query
        .Select(t => new
        {
            id = t.Id,
            name = t.Name,
            thumbnailUrl = t.ThumbnailUrl,
            count = item.HasValue ? t.Assets.Count(a => a.Item == item.Value) : t.Assets.Count
        })
        .Where(t => t.count > 0);

    // Autocomplete
    if (!string.IsNullOrWhiteSpace(prefix))
    {
        var suggestions = await reworkedQuery
            .OrderByDescending(t => t.count).ThenBy(t => t.name)
            .Take(8)
            .Select(t => new { t.name, t.count })
            .ToListAsync();
        return Ok(suggestions);
    }

    switch (sort)
    {
        case SortBy.Count:
            reworkedQuery = reverse
                ? reworkedQuery.OrderBy(t => t.count)
                : reworkedQuery.OrderByDescending(t => t.count);
            break;

        case SortBy.Alphabetical:
            reworkedQuery = reverse
                ? reworkedQuery.OrderByDescending(t => t.name)
                : reworkedQuery.OrderBy(t => t.name);
            break;
    }

    var totalCount = await reworkedQuery.CountAsync();

    var data = await reworkedQuery
        .Skip((page - 1) * tagsPerPage)
        .Take(tagsPerPage)
        .ToListAsync();

    return Ok(new { data, totalCount, totalPages = (int)Math.Ceiling((double)totalCount / tagsPerPage) });
}

// GET: api/Tags/5
    [HttpGet("{id}")]
    public async Task<ActionResult> GetTag(int id, bool includeAssets = false)
    {
        var tag = await context.Tags
            .Where(t => t.Id == id)
            .Select(t => new
            {
                id = t.Id,
                name = t.Name,
                description = t.Description,
                thumbnailUrl = t.ThumbnailUrl,
                count = t.Assets.Count,
                assets = includeAssets
                    ? t.Assets.Select(a => new
                    {
                        id = a.Id,
                        name = a.Name,
                        artistName = a.Artist.Name,
                        size = a.Size,
                        createdAt = a.CreatedAt,
                        thumbnailUrl = a.ThumbnailUrl,
                        item = a.Item,
                        type = a.Type
                    }).ToList()
                    : null
            })
            .FirstOrDefaultAsync();

        return tag is null ? NotFound() : Ok(tag);
    }

    // GET: api/Tags/5/download
    [HttpGet("{id}/download")]
    public async Task<IActionResult> DownloadCollection(int id)
    {
        var rootPath = environment.ContentRootPath;
        var uploadFolder = Path.Combine(rootPath, "wwwroot", "uploads", "files");

        var tag = await context.Tags
            .Where(t => t.Id == id)
            .Select(t => new
            {
                t.Name,
                Assets = t.Assets.Select(a => new { a.Id, a.Filename, FilePath = Path.Combine(uploadFolder, a.Filename) }).ToList() // adapt to your model
            })
            .FirstOrDefaultAsync();

        if (tag is null || tag.Assets.Count == 0) return NotFound();

        var bodyControl = HttpContext.Features.Get<IHttpBodyControlFeature>();
        if (bodyControl != null) bodyControl.AllowSynchronousIO = true;

        Response.ContentType = "application/zip";
        Response.Headers.ContentDisposition = $"attachment; filename=\"{tag.Name}.zip\"";

        using (var zip = new ZipArchive(Response.Body, ZipArchiveMode.Create, leaveOpen: true))
        {
            foreach (var a in tag.Assets)
            {
                if (!System.IO.File.Exists(a.FilePath)) continue;

                var entry = zip.CreateEntry($"{a.Id}_{a.Filename}", CompressionLevel.Fastest);
                await using var entryStream = entry.Open();
                await using var file = System.IO.File.OpenRead(a.FilePath);
                await file.CopyToAsync(entryStream);
            }
        }

        return new EmptyResult();
    }

// PUT: api/Tags/5
    [HttpPut("{id}")]
    public async Task<ActionResult> PutTag(int id, [FromForm] Tag tag)
    {
        if (id != tag.Id) return BadRequest();

        var existingTag = await context.Tags
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == id);
        if (existingTag is null) return NotFound();

        if (string.IsNullOrWhiteSpace(tag.Name)) return BadRequest(new { error = "Name is required." });
        var newName = tag.Name.ToLower().Trim().Replace(' ', '_');

        if (await context.Tags.AnyAsync(t => t.Name == newName && t.Id != id))
            return Conflict(new { error = "A tag with that name already exists." });

        var thumbnail = await fileService.HandleThumbnail(Request.Form.Files["thumbnail"]);
        if (thumbnail == "INVALID_TYPE")
            return BadRequest(new { error = "Only images are allowed for thumbnail." });

        context.Entry(tag).State = EntityState.Modified;

        tag.Name = newName;

        if (thumbnail != null)
        {
            if (!string.IsNullOrEmpty(existingTag.Thumbnail))
                fileService.DeleteFile(Path.Combine(environment.ContentRootPath, "wwwroot", "uploads", "thumbnails", existingTag.Thumbnail));
            tag.Thumbnail = thumbnail;
        }
        else
        {
            tag.Thumbnail = existingTag.Thumbnail;
        }

        await context.SaveChangesAsync();

        return Ok(new { tag.Id, tag.Name, tag.Thumbnail });
    }

}