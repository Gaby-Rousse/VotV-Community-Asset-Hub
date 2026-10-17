using System.Text.Json;
using VotVAssets.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VotVAssets.Models;
using Tag = VotVAssets.Models.Tag;
using Asset = VotVAssets.Models.Asset;
using VotVAssets.Models.Enums;
using System.Net.Http.Headers;
using Amazon.S3;
using Amazon.S3.Model;


namespace VotVAssets.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AssetsController(FileService fileService, IWebHostEnvironment environment, ApplicationDbContext context, UserManager<IdentityUser> userManager) : ControllerBase
{
    [Authorize]
    [HttpPost("{id}/transfer")]
    public async Task<IActionResult> TransferOwnership(long id, [FromForm] string username)
    {
        var asset = await context.Assets.FindAsync(id);
        if (asset == null) return NotFound();
        if (!User.IsInRole("Admin") && asset.OwnerId != userManager.GetUserId(User)) return Unauthorized();

        var newOwner = await userManager.FindByNameAsync(username.Replace(" ","_"));
        if (newOwner == null) return BadRequest(new { error = "User not found." });

        asset.OwnerId = newOwner.Id;
        await context.SaveChangesAsync();
        return Ok();
    }
    
    [Authorize(Roles = "Admin")]
    [HttpGet("trim-all")]
    public async Task<ActionResult> TrimEverything()
    {
        var assets = await context.Assets.ToListAsync();

        foreach (var asset in assets)
        {
            if (asset.Thumbnail != null)
            {
                var thumbnailPath = Path.Combine(
                    environment.ContentRootPath,
                    "wwwroot",
                    "uploads",
                    "thumbnails",
                    asset.Thumbnail
                );

                fileService.TrimTransparentImage(thumbnailPath, thumbnailPath);
            }
        }

        return Ok("Trimmed everything successfully.");
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("parse-all")]
    public async Task<ActionResult> ParseEverything()
    {
        var assets = await context.Assets.ToListAsync();

        foreach (var asset in assets)
        {
            if (asset.RawSize == null)
            {
                asset.RawSize = fileService.HandleFilesize(asset.Filename);
                context.Entry(asset).State = EntityState.Modified;
            }
        }

        await context.SaveChangesAsync();
        return Ok("Added size to files.");
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

        var query = context.Assets
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
            .Take(assetsPerPage).Select(a => new {
                a.Id,
                a.Name,
                a.ThumbnailUrl,
                a.FileUrl,
                a.Size,
                a.CreatedAt,
                ArtistName = a.Artist!.Name,
            })
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
    public async Task<ActionResult<Asset>> GetAsset(long id, bool seeChanges = false)
    {
        var asset = await context.Assets
            .Where(a => a.Id == id)
            .Include(a => a.Artist)
            .Include(a => a.Tags)
            .FirstOrDefaultAsync();

        if (asset == null) return NotFound();

        if (seeChanges)
        {
            var edit = await context.Edits
                .Where(edit => edit.TargetId == id && edit.SubmittedById == userManager.GetUserId(User) && edit.Table == Table.Asset)
                .FirstOrDefaultAsync();

            if (edit != null)
            {
                var dict = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(edit.Changes);
                
                if (dict.TryGetValue("thumbnail", out var thumbnail))
                    asset.Thumbnail = $"temp/{thumbnail.GetString()}";

                if (dict.TryGetValue("name", out var name))
                    asset.Name = name.ToString();
                
                if (dict.TryGetValue("artistId", out var artistId))
                {
                    var newArtistId = artistId.GetInt64();
                    asset.ArtistId = newArtistId;
                    asset.Artist = await context.Artists.FindAsync(newArtistId);
                }
                
                if (dict.TryGetValue("description", out var description))
                    asset.Description = description.ToString();
                
                if (dict.TryGetValue("source", out var source))
                    asset.Source = source.ToString();

                if (dict.TryGetValue("tags", out var tagsElement))
                {
                    var tagNames = tagsElement.Deserialize<string[]>() ?? [];
                    asset.Tags = tagNames.Select(n => new Tag { Name = n }).ToList();
                }
            }
        }
        

        return Ok(new {
            asset.Id,
            asset.Name,
            asset.OwnerId,
            asset.Filename,
            asset.ThumbnailUrl,
            asset.FileUrl,
            asset.PreviewUrl,
            asset.Size,
            asset.Item,
            asset.Type,
            asset.Description,
            asset.Source,
            Artist = asset.Artist == null ? null : new {
                asset.Artist.Id,
                asset.Artist.Name,
                asset.Artist.Description,
                asset.Artist.Socials,
                asset.Artist.PfpUrl,
            },
            Tags = asset.Tags.Select(t => t.Name)
        });
    }

    // GET: api/Assets/5/download
    [HttpGet("{id}/download")]
    public async Task<IActionResult> Download(long id, [FromServices] IAmazonS3 s3)
    {
        var asset = await context.Assets.FirstOrDefaultAsync(a => a.Id == id);
        if (asset is null) return NotFound();

        var disposition = new ContentDispositionHeaderValue("attachment")
        {
            FileNameStar = asset.Filename
        };

        var request = new GetPreSignedUrlRequest
        {
            BucketName = "votvbroadcast",
            Key = $"VCAH/uploads/files/{asset.Filename}",
            Verb = HttpVerb.GET,
            Protocol = Protocol.HTTPS,
            Expires = DateTime.UtcNow.AddMinutes(5),
            ResponseHeaderOverrides = { ContentDisposition = disposition.ToString() }
        };

        var url = await s3.GetPreSignedURLAsync(request);
        return Redirect(url);
    }

    // PUT: api/Assets/5
    // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
    [Authorize]
    [HttpPut("{id}")]
    public async Task<IActionResult> PutAsset(long id, [FromForm] Asset asset)
    {
        if (id != asset.Id) return BadRequest();

        var existingAsset = await context.Assets
            .AsNoTracking()
            .Include(a => a.Tags)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (existingAsset == null) return NotFound();
        var (tagNames, tagError) = ParseTags(Request.Form);
        if (tagError != null) return BadRequest(new { error = tagError });

        if (!User.IsInRole("Admin") && existingAsset.OwnerId != userManager.GetUserId(User))
        {
            var changes = new Dictionary<string, object?>();

            if (asset.Name != existingAsset.Name)
                changes["name"] = asset.Name;

            if (asset.Description != existingAsset.Description)
                changes["description"] = asset.Description;

            if (asset.Source != existingAsset.Source)
                changes["source"] = asset.Source;

            if (asset.ArtistId != existingAsset.ArtistId)
                changes["artistId"] = asset.ArtistId;

            if (asset.Type != existingAsset.Type)
                changes["type"] = asset.Type;

            var tempThumbnail = await fileService.HandleThumbnail(Request.Form.Files["thumbnail"], true);
            if (tempThumbnail != null)
            {
                if (tempThumbnail == "INVALID_TYPE")
                    return BadRequest(new { error = "Only images are allowed for thumbnail." });
                changes["thumbnail"] = tempThumbnail;
            }

            string? tempPreview = null;
            string error = "";
            if (existingAsset.Item == ItemEnum.Model)
            {
                tempPreview = await fileService.HandlePreview(Request.Form.Files["preview"], true);
                error = "Only .glb files are allowed for the 3D preview";
            }

            if (existingAsset.Item == ItemEnum.Atv)
            {
                tempPreview = await fileService.HandleATVPreviewFromForm(Request.Form.Files["preview"], true);
                error = "Only images are allowed for the ATV preview";
            }



            if (tempPreview != null)
            {
                if (tempPreview == "INVALID_TYPE")
                    return BadRequest(new { error });
                changes["preview"] = tempPreview;
            }

            var existingTags = existingAsset.Tags?
                .Select(t => t.Name)
                .OrderBy(t => t)
                .ToList() ?? new List<string>();

            if (!tagNames.SequenceEqual(existingTags))
                changes["tags"] = tagNames;

            if (changes.Count == 0)
                return NoContent();

            var pendingEdit = await context.Edits
                .FirstOrDefaultAsync(e =>
                    e.TargetId == existingAsset.Id &&
                    e.Table == Table.Asset &&
                    e.SubmittedById == userManager.GetUserId(User));

            if (pendingEdit != null)
            {
                var pendingChanges = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(pendingEdit.Changes);

                if (changes.ContainsKey("thumbnail"))
                {
                    if (pendingChanges.ContainsKey("thumbnail"))
                    {
                        pendingChanges.TryGetValue("thumbnail", out JsonElement oldThumbnail);
                        fileService.DeleteFile(Path.Combine("temp_uploads", "thumbnails", oldThumbnail.GetString() ?? ""));
                    }
                }
                else if (pendingChanges.ContainsKey("thumbnail"))
                {
                    changes["thumbnail"] = pendingChanges["thumbnail"];
                }

                if (changes.ContainsKey("preview"))
                {
                    if (pendingChanges.ContainsKey("preview"))
                    {
                        pendingChanges.TryGetValue("preview", out JsonElement oldPreview);
                        fileService.DeleteFile(Path.Combine("temp_uploads", "previews", oldPreview.GetString() ?? ""));
                    }
                }
                else if (pendingChanges.ContainsKey("preview"))
                {
                    changes["preview"] = pendingChanges["preview"];
                }

                pendingEdit.Changes = JsonSerializer.Serialize(changes);
            }
            else
            {
                pendingEdit = new Edit
                {
                    SubmittedById = userManager.GetUserId(User)!,
                    Table = Table.Asset,
                    TargetId = existingAsset.Id,
                    Changes = JsonSerializer.Serialize(changes)
                };

                context.Edits.Add(pendingEdit);
            }

            await context.SaveChangesAsync();

            return NoContent();
        }

        context.Entry(asset).State = EntityState.Modified;

        asset.OwnerId = existingAsset.OwnerId;
        asset.Filename = existingAsset.Filename;
        asset.CreatedAt = existingAsset.CreatedAt;
        asset.RawSize = existingAsset.RawSize;

        var thumbnail = await fileService.HandleThumbnail(Request.Form.Files["thumbnail"]);
        if (thumbnail != null)
        {
            if (thumbnail == "INVALID_TYPE")
                return BadRequest(new { error = "Only images are allowed for thumbnail." });
            fileService.DeleteFile(Path.Combine("uploads", "thumbnails", existingAsset.Thumbnail ?? ""));
            asset.Thumbnail = thumbnail;
        }
        else
        {
            asset.Thumbnail = existingAsset.Thumbnail;
        }

        asset.Preview = existingAsset.Preview;

        if (asset.Item == ItemEnum.Atv)
        {
            var preview = await fileService.HandleATVPreviewFromForm(Request.Form.Files["preview"]);
            if (preview != null)
            {
                if (preview == "INVALID_TYPE")
                    return BadRequest(new { error = "Only images are allowed for the ATV preview" });

                fileService.DeleteFile(Path.Combine("uploads", "previews", existingAsset.Preview ?? ""));
                asset.Preview = preview;
            }
        }

        if (asset.Item == ItemEnum.Model)
        {
            var preview = await fileService.HandlePreview(Request.Form.Files["preview"]);
            if (preview != null)
            {
                if (preview == "INVALID_TYPE")
                    return BadRequest(new { error = "Only .glb files are allowed for the 3D preview" });

                fileService.DeleteFile(Path.Combine("uploads", "previews", existingAsset.Preview ?? ""));
                asset.Preview = preview;
            }
        }

        var assetWithTags = await context.Assets
            .Include(a => a.Tags)
            .FirstAsync(a => a.Id == id);
        await SyncTags(assetWithTags, tagNames);

        try
        {
            await context.SaveChangesAsync();
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
        asset.OwnerId = userManager.GetUserId(User);

        //tag validation + parsing
        var (tagNames, tagError) = ParseTags(Request.Form);
        if (tagError != null) return BadRequest(new { error = tagError });

        var thumbnail = await fileService.HandleThumbnail(Request.Form.Files["thumbnail"]);
        if (thumbnail != null)
        {
            if (thumbnail == "INVALID_TYPE")
                return BadRequest(new { error = "Only images are allowed for thumbnail." });
            asset.Thumbnail = thumbnail;
        }


        var fileName = await fileService.HandleFile(Request.Form.Files["file"]);

        if (fileName != null)
        {
            if (fileName == "INVALID_TYPE") return BadRequest(new { error = "Only images or archive files allowed." });

            asset.Filename = fileName;
        }
        else
        {
            return BadRequest(new { error = "A file is required." });
        }

        if (asset.Item == ItemEnum.Model)
        {
            var preview = await fileService.HandlePreview(Request.Form.Files["preview"]);
            if (preview != null)
            {
                if (preview == "INVALID_TYPE")
                    return BadRequest(new { error = "Only .glb files are allowed for the 3D preview" });
                asset.Preview = preview;
            }
            else
            {
                // No .glb supplied: try to build one from the uploaded .zip (.obj + texture).
                asset.Preview = await fileService.HandleModelPreview(asset.Filename);
            }
        }

        if (asset.Item == ItemEnum.Atv)
        {
            string? preview;
            if (Request.Form.Files["preview"] != null)
                preview = await fileService.HandleATVPreviewFromForm(Request.Form.Files["preview"]);
            else
                preview = await fileService.HandleATVPreview(asset.Filename, null);

            if (preview != null)
            {
                if (preview == "INVALID_TYPE")
                    return BadRequest(new { error = "Only images are allowed for the ATV preview." });
                asset.Preview = preview;
            }
        }

        asset.RawSize = fileService.HandleFilesize(fileName);

        context.Assets.Add(asset);
        await SyncTags(asset, tagNames);
        await context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAsset), new { id = asset.Id }, asset);
    }

    // DELETE: api/Assets/5
    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAsset(long id)
    {
        var asset = await context.Assets.FindAsync(id);
        if (asset == null) return NotFound();
        if (!User.IsInRole("Admin") && asset.OwnerId != userManager.GetUserId(User)) return Unauthorized();
        
        var edits = await context.Edits
            .Where(e => e.TargetId == id && e.Table == Table.Asset)
            .ToListAsync();

        foreach (var edit in edits)
        {
            var changes = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(edit.Changes);
    
            if (changes.TryGetValue("thumbnail", out var thumbnail))
                fileService.DeleteFile(Path.Combine("temp_uploads", "thumbnails", thumbnail.GetString()!));
    
            if (changes.TryGetValue("preview", out var preview))
                fileService.DeleteFile(Path.Combine("temp_uploads", "previews", preview.GetString()!));
        }

        context.Edits.RemoveRange(edits);

        context.Assets.Remove(asset);
        await context.SaveChangesAsync();

        fileService.DeleteFile(
            Path.Combine("uploads", "thumbnails", asset.Thumbnail ?? ""));
        fileService.DeleteFile(Path.Combine("uploads", "files", asset.Filename ?? ""));
        fileService.DeleteFile(Path.Combine("uploads", "previews", asset.Preview ?? ""));
        return NoContent();
    }

    private bool AssetExists(long id)
    {
        return context.Assets.Any(e => e.Id == id);
    }



    private const int MaxTags = 100;
    private const int MaxTagLength = 50;

    private static (List<string> Tags, string? Error) ParseTags(IFormCollection form)
    {
        var tags = form["tags"]
            .Where(t => !string.IsNullOrWhiteSpace(t))
            .Select(t => t!.ToLower().Trim().Replace(' ', '_'))
            .Distinct()
            .OrderBy(t => t)
            .ToList();

        if (tags.Count > MaxTags)
            return (tags, $"Too many tags (max {MaxTags}).");

        if (tags.Any(t => t.Length > MaxTagLength))
            return (tags, $"Tags can be at most {MaxTagLength} characters.");

        return (tags, null);
    }

    private async Task SyncTags(Asset asset, List<string> tagNames)
    {
        asset.Tags.Clear();
        foreach (var name in tagNames)
        {
            var tag = await context.Tags.FirstOrDefaultAsync(t => t.Name == name)
                      ?? new Tag { Name = name };
            asset.Tags.Add(tag);
        }
    }
}