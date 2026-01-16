using Aspose.ThreeD;
using Aspose.ThreeD.Entities;
using Aspose.ThreeD.Formats;
using Aspose.ThreeD.Shading;
using Aspose.ThreeD.Utilities;
using Aspose.Zip;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SixLabors.ImageSharp;
using VotVAssets.Models;
using Asset = VotVAssets.Models.Asset;
using Image = SixLabors.ImageSharp.Image;


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
    public async Task<ActionResult<IEnumerable<AssetDto>>> GetAssets(
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

        //https://learn.microsoft.com/en-us/dotnet/framework/data/adonet/ef/language-reference/method-based-query-syntax-examples-join-operators
        //idk why we must do a select afterward
        var joinedQuery = query.Join(
            _context.Artists,
            asset => asset.ArtistId,
            artist => artist.Id,
            (asset, artist) => new AssetDto
            {
                Id = asset.Id,
                Name = asset.Name,
                ArtistName = artist.Name,
                OwnerId = asset.OwnerId,
                ArtistId = asset.ArtistId,
                Filename = asset.Filename,
                Item = asset.Item,
                Description = asset.Description,
                Thumbnail = asset.Thumbnail,
                Source = asset.Source,
                Tags = asset.Tags,
                Type = asset.Type,
                Preview = asset.Preview,
                CreatedAt = asset.CreatedAt,
                UpdatedAt = asset.UpdatedAt
            }
        );

        return await joinedQuery.ToListAsync();
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
    public async Task<IActionResult> PutAsset(long id, [FromForm] Asset asset)
    {
        if (id != asset.Id) return BadRequest();

        //https://stackoverflow.com/a/56865203 goofy
        var existingAsset = await _context.Assets.AsNoTracking().FirstOrDefaultAsync(a => a.Id == id);
        if (!User.IsInRole("Admin") && existingAsset.OwnerId != _userManager.GetUserId(User)) return Unauthorized();

        _context.Entry(asset).State = EntityState.Modified;

        asset.OwnerId = existingAsset.OwnerId;
        asset.Filename = existingAsset.Filename;
        asset.CreatedAt = existingAsset.CreatedAt;

        var thumbnail = await HandleThumbnail(Request.Form.Files["thumbnail"]);
        if (thumbnail != null)
        {
            DeleteFile(Path.Combine(_environment.ContentRootPath, "wwwroot", "uploads", "thumbnails",
                existingAsset.Thumbnail ?? ""));
            asset.Thumbnail = thumbnail;
        }
        else
        {
            asset.Thumbnail = existingAsset.Thumbnail;
        }

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
        {
            if (file == "INVALID_TYPE") return BadRequest(new { error = "Only images or .zip files allowed." });

            asset.Filename = file;
        }
        else
        {
            return BadRequest(new { error = "A file is required." });
        }

        if (asset.Item == ItemEnum.Model)
            asset.Preview = await ConvertAndSaveGlb(Path.Combine(_environment.ContentRootPath, "wwwroot", "uploads",
                "files", asset.Filename));

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
        if (!User.IsInRole("Admin") && asset.OwnerId != _userManager.GetUserId(User)) return Unauthorized();
        if (asset == null) return NotFound();

        _context.Assets.Remove(asset);
        await _context.SaveChangesAsync();

        DeleteFile(
            Path.Combine(_environment.ContentRootPath, "wwwroot", "uploads", "thumbnails", asset.Thumbnail ?? ""));
        DeleteFile(Path.Combine(_environment.ContentRootPath, "wwwroot", "uploads", "files", asset.Filename ?? ""));
        return NoContent();
    }

    private bool AssetExists(long id)
    {
        return _context.Assets.Any(e => e.Id == id);
    }

    private void DeleteFile(string filepath)
    {
        if (System.IO.File.Exists(filepath))
            System.IO.File.Delete(filepath);
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
        if (file == null) return null;

        var rootPath = _environment.ContentRootPath;
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

    //AI GENERATED
    public async Task<string> ConvertAndSaveGlb(string zipPath)
    {
        TrialException.SuppressTrialException = true;

        var tempPath = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString());
        Directory.CreateDirectory(tempPath);

        try
        {
            // Extract ZIP contents
            using (var archive = new Archive(zipPath))
            {
                archive.ExtractToDirectory(tempPath);
            }

            // Find the OBJ file
            var objFile = Directory.GetFiles(tempPath, "*.obj", SearchOption.AllDirectories).FirstOrDefault();
            if (objFile == null)
                throw new FileNotFoundException("No .obj file found in the ZIP archive.");

            // Load the scene with proper options
            var loadOptions = new ObjLoadOptions
            {
                EnableMaterials = true,
                FlipCoordinateSystem = true,
                LookupPaths = new List<string> { tempPath }
            };

            var scene = Scene.FromFile(objFile, loadOptions);

            // Find textures in the extracted folder
            var textureFiles = Directory.GetFiles(tempPath, "*.*", SearchOption.AllDirectories)
                .Where(f => f.EndsWith(".png", StringComparison.OrdinalIgnoreCase) ||
                            f.EndsWith(".jpg", StringComparison.OrdinalIgnoreCase) ||
                            f.EndsWith(".jpeg", StringComparison.OrdinalIgnoreCase))
                .Where(f => !Path.GetFileName(f).Equals("icon.png", StringComparison.OrdinalIgnoreCase))
                .ToList();

            // Prioritize diffuse texture
            var diffuseTexture = textureFiles.FirstOrDefault(f =>
                Path.GetFileName(f).StartsWith("diffuse_", StringComparison.OrdinalIgnoreCase));

            var pbrTexture = textureFiles.FirstOrDefault(f =>
                Path.GetFileName(f).StartsWith("pbr_", StringComparison.OrdinalIgnoreCase));

            var mainTexture = diffuseTexture ?? pbrTexture ?? textureFiles.FirstOrDefault();

            // Create embedded texture object if we have a texture file
            Texture? textureObj = null;
            if (mainTexture != null)
            {
                var textureBytes = await System.IO.File.ReadAllBytesAsync(mainTexture);
                textureObj = new Texture
                {
                    Content = textureBytes,
                    FileName = Path.GetFileName(mainTexture)
                };
            }

            // Create PBR material
            var newMaterial = new PbrMaterial
            {
                Name = "EmbeddedMaterial",
                MetallicFactor = 0.0,
                RoughnessFactor = 0.5
            };

            if (textureObj != null)
            {
                newMaterial.AlbedoTexture = textureObj;
                newMaterial.Albedo = new Vector3(1.0, 1.0, 1.0);
            }
            else
            {
                newMaterial.Albedo = new Vector3(0.8, 0.8, 0.8);
            }

            // First pass: collect collision meshes to remove
            var nodesToRemove = new List<Node>();
            scene.RootNode.Accept(n =>
            {
                if (n.Name != null && (
                        n.Name.StartsWith("UCX_", StringComparison.OrdinalIgnoreCase) ||
                        n.Name.StartsWith("UBX_", StringComparison.OrdinalIgnoreCase) ||
                        n.Name.StartsWith("USP_", StringComparison.OrdinalIgnoreCase) ||
                        n.Name.StartsWith("UCP_", StringComparison.OrdinalIgnoreCase)))
                    nodesToRemove.Add(n);
                return true;
            });

            // Remove collision meshes
            foreach (var nodeToRemove in nodesToRemove) nodeToRemove.ParentNode?.ChildNodes.Remove(nodeToRemove);

            // Second pass: apply materials and fix meshes
            scene.RootNode.Accept(n =>
            {
                if (n.Entity is Mesh mesh)
                {
                    // Generate normals if missing
                    if (mesh.GetElement(VertexElementType.Normal) == null) PolygonModifier.GenerateNormal(mesh);

                    // Only generate UVs if they don't exist
                    if (mesh.GetElement(VertexElementType.UV) == null) PolygonModifier.GenerateUV(mesh);

                    // Apply material
                    n.Material = newMaterial;
                }

                return true;
            });

            // Prepare output path
            var filename = $"{Guid.NewGuid()}.glb";
            var outputDir = Path.Combine(_environment.WebRootPath, "uploads", "previews");
            Directory.CreateDirectory(outputDir);
            var outputPath = Path.Combine(outputDir, filename);

            // Save as GLB with embedded assets
            var saveOptions = new GltfSaveOptions(FileFormat.GLTF2_Binary)
            {
                EmbedAssets = true,
                SaveExtras = false,
                FlipTexCoordV = true
            };

            scene.Save(outputPath, saveOptions);

            return filename;
        }
        finally
        {
            // Cleanup temporary files
            if (Directory.Exists(tempPath))
                try
                {
                    Directory.Delete(tempPath, true);
                }
                catch
                {
                    // Ignore cleanup errors
                }
        }
    }
}