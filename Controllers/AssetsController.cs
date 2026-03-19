using System.Text.Json;
using ImageMagick;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Png;
using VotVAssets.Models;
using Asset = VotVAssets.Models.Asset;
using Image = SixLabors.ImageSharp.Image;
using SixLabors.ImageSharp.Processing;
using SixLabors.ImageSharp.PixelFormats;
using VotVAssets.Models.Enums;

namespace VotVAssets.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AssetsController(IWebHostEnvironment environment, ApplicationDbContext context, UserManager<IdentityUser> userManager) : ControllerBase
{
    [Authorize]
    [HttpPost("{id}/transfer")]
    public async Task<IActionResult> TransferOwnership(long id, [FromForm] string newOwnerId)
    {
        var asset = await context.Assets.FindAsync(id);
        if (asset == null) return NotFound();
        if (!User.IsInRole("Admin") && asset.OwnerId != userManager.GetUserId(User)) return Unauthorized();

        var newOwner = await userManager.FindByIdAsync(newOwnerId);
        if (newOwner == null) return BadRequest(new { error = "User not found." });

        asset.OwnerId = newOwnerId;
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

                TrimTransparentImage(thumbnailPath, thumbnailPath);
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
                asset.RawSize = await HandleFilesize(asset.Filename);
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
            .Take(assetsPerPage)
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
        

        return asset;
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

            var tempThumbnail = await HandleThumbnail(Request.Form.Files["thumbnail"], true);
            if (tempThumbnail != null)
            {
                if (tempThumbnail == "INVALID_TYPE")
                    return BadRequest(new { error = "Only images are allowed for thumbnail." });
                changes["thumbnail"] = tempThumbnail;
            }

            var tempPreview = await HandlePreview(Request.Form.Files["preview"], true);
            if (tempPreview != null)
            {
                if (tempPreview == "INVALID_TYPE")
                    return BadRequest(new { error = "Only .glb files are allowed for the 3D preview" });
                changes["preview"] = tempPreview;
            }

            var incomingTags = Request.Form["tags"]
                .Where(t => !string.IsNullOrWhiteSpace(t))
                .Select(t => t!.ToLower().Trim().Replace(' ', '_'))
                .OrderBy(t => t)
                .ToList();

            var existingTags = existingAsset.Tags?
                .Select(t => t.Name)
                .OrderBy(t => t)
                .ToList() ?? new List<string>();

            if (!incomingTags.SequenceEqual(existingTags))
                changes["tags"] = incomingTags;

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
                        DeleteFile(Path.Combine(environment.ContentRootPath, "wwwroot", "temp_uploads", "thumbnails", oldThumbnail.GetString() ?? ""));
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
                        DeleteFile(Path.Combine(environment.ContentRootPath, "wwwroot", "temp_uploads", "previews", oldPreview.GetString() ?? ""));
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

        var thumbnail = await HandleThumbnail(Request.Form.Files["thumbnail"]);
        if (thumbnail != null)
        {
            if (thumbnail == "INVALID_TYPE")
                return BadRequest(new { error = "Only images are allowed for thumbnail." });
            DeleteFile(Path.Combine(environment.ContentRootPath, "wwwroot", "uploads", "thumbnails",
                existingAsset.Thumbnail ?? ""));
            asset.Thumbnail = thumbnail;
        }
        else
        {
            asset.Thumbnail = existingAsset.Thumbnail;
        }

        asset.Preview = existingAsset.Preview;


        var preview = await HandlePreview(Request.Form.Files["preview"]);
        if (preview != null)
        {
            if (preview == "INVALID_TYPE")
                return BadRequest(new { error = "Only .glb files are allowed for the 3D preview" });

            DeleteFile(Path.Combine(environment.ContentRootPath, "wwwroot", "uploads", "previews",
                existingAsset.Preview ?? ""));
            asset.Preview = preview;
        }


        var assetWithTags = await context.Assets
            .Include(a => a.Tags)
            .FirstAsync(a => a.Id == id);
        await SyncTags(assetWithTags, Request.Form);

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

        var thumbnail = await HandleThumbnail(Request.Form.Files["thumbnail"]);
        if (thumbnail != null)
        {
            if (thumbnail == "INVALID_TYPE")
                return BadRequest(new { error = "Only images are allowed for thumbnail." });
            asset.Thumbnail = thumbnail;
        }


        var fileName = await HandleFile(Request.Form.Files["file"]);

        if (fileName != null)
        {
            if (fileName == "INVALID_TYPE") return BadRequest(new { error = "Only images or .zip files allowed." });

            asset.Filename = fileName;
        }
        else
        {
            return BadRequest(new { error = "A file is required." });
        }

        if (asset.Item == ItemEnum.Model)
        {
            var preview = await HandlePreview(Request.Form.Files["preview"]);
            if (preview != null)
            {
                if (preview == "INVALID_TYPE")
                    return BadRequest(new { error = "Only .glb files are allowed for the 3D preview" });
                asset.Preview = preview;
            }
        }

        asset.RawSize = await HandleFilesize(fileName);

        context.Assets.Add(asset);
        await SyncTags(asset, Request.Form);
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
                DeleteFile(Path.Combine(environment.ContentRootPath, "wwwroot", "temp_uploads", "thumbnails", thumbnail.GetString()!));
    
            if (changes.TryGetValue("preview", out var preview))
                DeleteFile(Path.Combine(environment.ContentRootPath, "wwwroot", "temp_uploads", "previews", preview.GetString()!));
        }

        context.Edits.RemoveRange(edits);

        context.Assets.Remove(asset);
        await context.SaveChangesAsync();

        DeleteFile(
            Path.Combine(environment.ContentRootPath, "wwwroot", "uploads", "thumbnails", asset.Thumbnail ?? ""));
        DeleteFile(Path.Combine(environment.ContentRootPath, "wwwroot", "uploads", "files", asset.Filename ?? ""));
        DeleteFile(
            Path.Combine(environment.ContentRootPath, "wwwroot", "uploads", "previews", asset.Preview ?? ""));
        return NoContent();
    }

    private bool AssetExists(long id)
    {
        return context.Assets.Any(e => e.Id == id);
    }

    private void DeleteFile(string filepath)
    {
        if (System.IO.File.Exists(filepath))
            System.IO.File.Delete(filepath);
    }

    private async Task<string?> HandleThumbnail(IFormFile? thumbnail, bool temp = false)
    {
        if (thumbnail == null) return null;

        var rootPath = environment.ContentRootPath;
        var uploadFolder = Path.Combine(rootPath, "wwwroot", temp ? "temp_uploads" : "uploads", "thumbnails");

        try
        {
            var info = await Image.IdentifyAsync(thumbnail.OpenReadStream());
        }
        catch (Exception)
        {
            return "INVALID_TYPE";
        }

        var fileName = $"{Guid.NewGuid()}{Path.GetExtension(thumbnail.FileName)}";
        var fullPath = Path.Combine(uploadFolder, fileName);

        await using (var stream = new FileStream(fullPath, FileMode.Create))
        {
            await thumbnail.CopyToAsync(stream);
        }

        await Task.Run(() =>
        {
            TrimTransparentImage(fullPath, fullPath);
            var optimizer = new ImageOptimizer();
            optimizer.Compress(fullPath);
        });

        return fileName;
    }

    private async Task<string?> HandlePreview(IFormFile? preview, bool temp = false)
    {
        if (preview == null) return null;

        string ext = Path.GetExtension(Request.Form.Files["preview"].FileName);
        if (!string.Equals(ext, ".glb", StringComparison.OrdinalIgnoreCase))
            return "INVALID_TYPE";

        var rootPath = environment.ContentRootPath;
        var uploadFolder = Path.Combine(rootPath, "wwwroot", temp ? "temp_uploads" : "uploads", "previews");

        var fileName = $"{Guid.NewGuid()}{Path.GetExtension(preview.FileName)}";
        var fullPath = Path.Combine(uploadFolder, fileName);

        await using (var stream = new FileStream(fullPath, FileMode.Create))
        {
            await preview.CopyToAsync(stream);
        }

        return fileName;
    }

    private async Task<string?> HandleFile(IFormFile? file)
    {
        if (file == null) return null;

        var rootPath = environment.ContentRootPath;
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

    private async Task<long?> HandleFilesize(string fileName)
    {
        var rootPath = environment.ContentRootPath;
        var path = Path.Combine(rootPath, "wwwroot", "uploads", "files", fileName);
        long length = new System.IO.FileInfo(path).Length;
        return length;
    }

    private void TrimTransparentImage(string inputPath, string outputPath)
    {
        using var image = Image.Load<Rgba32>(inputPath);

        int width = image.Width;
        int height = image.Height;

        int top = 0;
        int bottom = height - 1;
        int left = 0;
        int right = width - 1;

        //https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/statements/jump-statements

        // 1 2 3 4 5
        // 6 7 8 top
        //
        //
        // 
        for (int y = 0; y < height; y++)
        {
            for (int x = 0; x < width; x++)
            {
                if (image[x, y].A > 0)
                {
                    top = y;
                    goto FoundTop;
                }
            }
        }

        FoundTop:

        //
        //
        //
        //6 7 8 bottom
        //1 2 3 4 5
        for (int y = height - 1; y >= top; y--)
        {
            for (int x = 0; x < width; x++)
            {
                if (image[x, y].A > 0)
                {
                    bottom = y;
                    goto FoundBottom;
                }
            }
        }

        FoundBottom:


        //1 2 3 4 5
        //left
        //
        //
        //
        for (int x = 0; x < width; x++)
        {
            for (int y = top; y <= bottom; y++)
            {
                if (image[x, y].A > 0)
                {
                    left = x;
                    goto FoundLeft;
                }
            }
        }

        FoundLeft:

        //5 4 3 2 1
        //        right  
        //
        //
        //
        for (int x = width - 1; x >= left; x--)
        {
            for (int y = top; y <= bottom; y++)
            {
                if (image[x, y].A > 0)
                {
                    right = x;
                    goto FoundRight;
                }
            }
        }

        FoundRight:


        // 0 0 0 0 0
        // left-top x x x right-top
        // x x x x x
        // left-bottom x x x right bottom
        // 0 0 0 0 0
        int cropWidth = right - left + 1;
        int cropHeight = bottom - top + 1;

        if (cropWidth > 0 && cropHeight > 0)
        {
            image.Mutate(ctx => ctx.Crop(new Rectangle(left, top, cropWidth, cropHeight)));
        }

        image.Save(outputPath);
    }

    private async Task SyncTags(Asset asset, IFormCollection form)
    {
        asset.Tags.Clear();

        var tagNames = form["tags"]
            .Where(t => !string.IsNullOrWhiteSpace(t))
            .Select(t => t!.ToLower().Trim().Replace(' ', '_'))
            .Distinct()
            .Take(10)
            .ToList();

        foreach (var name in tagNames)
        {
            var tag = await context.Tags.FirstOrDefaultAsync(t => t.Name == name)
                      ?? new Tag { Name = name };
            asset.Tags.Add(tag);
        }
    }
}