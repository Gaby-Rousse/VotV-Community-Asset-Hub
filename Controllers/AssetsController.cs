
using Aspose.ThreeD;
using Aspose.ThreeD.Entities;
using Aspose.ThreeD.Formats;
using Aspose.ThreeD.Shading;
using Aspose.ThreeD.Utilities;
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
        DeleteFile(
            Path.Combine(_environment.ContentRootPath, "wwwroot", "uploads", "previews", asset.Preview ?? ""));
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
        System.IO.Compression.ZipFile.ExtractToDirectory(zipPath, tempPath, true);

        // Find the OBJ file
        var objFile = Directory.GetFiles(tempPath, "*.obj", SearchOption.AllDirectories).FirstOrDefault();
        if (objFile == null)
            throw new FileNotFoundException("No .obj file found in the ZIP archive.");

        // Parse MTL file for material->texture mappings
        var mtlMappings = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        var mtlFile = Directory.GetFiles(tempPath, "*.mtl", SearchOption.AllDirectories).FirstOrDefault();
        
        if (mtlFile != null)
        {
            var mtlContent = await System.IO.File.ReadAllTextAsync(mtlFile);
            var mtlLines = mtlContent.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
            string? currentMaterial = null;
            
            foreach (var line in mtlLines)
            {
                var trimmed = line.Trim();
                if (string.IsNullOrWhiteSpace(trimmed) || trimmed.StartsWith("#"))
                    continue;
                    
                if (trimmed.StartsWith("newmtl "))
                {
                    currentMaterial = trimmed.Substring(7).Trim();
                }
                else if (currentMaterial != null && trimmed.StartsWith("map_Kd "))
                {
                    var texturePath = trimmed.Substring(7).Trim();
                    var textureName = Path.GetFileName(texturePath);
                    if (!mtlMappings.ContainsKey(currentMaterial))
                        mtlMappings[currentMaterial] = textureName;
                }
            }
        }

        // Load textures
        var textureFiles = Directory.GetFiles(tempPath, "*.*", SearchOption.AllDirectories)
            .Where(f => f.EndsWith(".png", StringComparison.OrdinalIgnoreCase) ||
                        f.EndsWith(".jpg", StringComparison.OrdinalIgnoreCase) ||
                        f.EndsWith(".jpeg", StringComparison.OrdinalIgnoreCase))
            .Where(f => !Path.GetFileName(f).Equals("icon.png", StringComparison.OrdinalIgnoreCase))
            .ToList();

        var textureCache = new Dictionary<string, Texture>(StringComparer.OrdinalIgnoreCase);
        foreach (var texFile in textureFiles)
        {
            var texBytes = await System.IO.File.ReadAllBytesAsync(texFile);
            var texName = Path.GetFileName(texFile);
            textureCache[texName] = new Texture { Content = texBytes, FileName = texName };
        }

        // CRITICAL FIX: Manually split OBJ by material groups
        Console.WriteLine("\n=== Analyzing OBJ structure ===");
        var objContent = await System.IO.File.ReadAllTextAsync(objFile);
        var objLines = objContent.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
        
        var usemtlLines = objLines.Where(l => l.Trim().StartsWith("usemtl ")).ToList();
        Console.WriteLine($"Found {usemtlLines.Count} material switches");
        
        Scene scene;
        
        // Only split if we have multiple DIFFERENT materials
        var uniqueMaterials = usemtlLines
            .Select(l => l.Trim().Substring(7).Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
        
        Console.WriteLine($"Unique materials: {string.Join(", ", uniqueMaterials)}");
        
        if (uniqueMaterials.Count > 1)
        {
            Console.WriteLine("Multi-material OBJ detected - splitting into separate OBJ files per material");
            
            // First, collect all vertex data (shared by all materials)
            var allVertices = new List<string>();
            var allTexCoords = new List<string>();
            var allNormals = new List<string>();
            var headerLines = new List<string>();
            
            // Parse OBJ and split faces by material
            var materialFaces = new Dictionary<string, List<string>>();
            var currentMat = "default";
            
            foreach (var line in objLines)
            {
                var trimmed = line.Trim();
                
                if (trimmed.StartsWith("mtllib ") || trimmed.StartsWith("#"))
                {
                    headerLines.Add(line);
                }
                else if (trimmed.StartsWith("v "))
                {
                    allVertices.Add(line);
                }
                else if (trimmed.StartsWith("vt "))
                {
                    allTexCoords.Add(line);
                }
                else if (trimmed.StartsWith("vn "))
                {
                    allNormals.Add(line);
                }
                else if (trimmed.StartsWith("usemtl "))
                {
                    currentMat = trimmed.Substring(7).Trim();
                    if (!materialFaces.ContainsKey(currentMat))
                        materialFaces[currentMat] = new List<string>();
                }
                else if (trimmed.StartsWith("f "))
                {
                    if (!materialFaces.ContainsKey(currentMat))
                        materialFaces[currentMat] = new List<string>();
                    materialFaces[currentMat].Add(line);
                }
            }
            
            Console.WriteLine($"Vertex data: {allVertices.Count} vertices, {allTexCoords.Count} UVs, {allNormals.Count} normals");
            Console.WriteLine($"Split into {materialFaces.Count} material groups:");
            foreach (var mat in materialFaces.Keys)
                Console.WriteLine($"  - {mat} ({materialFaces[mat].Count} faces)");
            
            // Create separate OBJ file for each material
            var splitObjFiles = new List<(string material, string objPath)>();
            
            foreach (var kvp in materialFaces)
            {
                var matName = kvp.Key;
                var faces = kvp.Value;
                
                if (matName == "default" || faces.Count == 0)
                    continue; // Skip default/empty groups
                
                var splitObjPath = Path.Combine(tempPath, $"split_{matName}.obj");
                var splitObjContent = new List<string>();
                
                // Add header
                splitObjContent.AddRange(headerLines);
                
                // Add ALL vertex data (needed for face indices to work)
                splitObjContent.AddRange(allVertices);
                splitObjContent.AddRange(allTexCoords);
                splitObjContent.AddRange(allNormals);
                
                // Add material and faces
                splitObjContent.Add($"usemtl {matName}");
                splitObjContent.AddRange(faces);
                
                await System.IO.File.WriteAllLinesAsync(splitObjPath, splitObjContent);
                splitObjFiles.Add((matName, splitObjPath));
                Console.WriteLine($"  Created: split_{matName}.obj");
            }
            
            // Load each split OBJ as a separate mesh
            var loadOptions = new ObjLoadOptions
            {
                EnableMaterials = true,
                FlipCoordinateSystem = true,
                LookupPaths = new List<string> { tempPath }
            };
            
            var combinedScene = new Scene();
            
            foreach (var (matName, splitPath) in splitObjFiles)
            {
                try
                {
                    var partScene = Scene.FromFile(splitPath, loadOptions);
                    
                    // Find the mesh and add it to combined scene
                    partScene.RootNode.Accept(n =>
                    {
                        if (n.Entity is Mesh mesh)
                        {
                            // Generate normals/UVs if needed
                            if (mesh.GetElement(VertexElementType.Normal) == null)
                                PolygonModifier.GenerateNormal(mesh);
                            if (mesh.GetElement(VertexElementType.UV) == null)
                                PolygonModifier.GenerateUV(mesh);
                            
                            // Create node in combined scene
                            var newNode = combinedScene.RootNode.CreateChildNode($"{matName}_mesh", mesh);
                            
                            // Find and apply texture
                            Texture? tex = null;
                            
                            if (mtlMappings.TryGetValue(matName, out var texName))
                                textureCache.TryGetValue(texName, out tex);
                            
                            if (tex == null)
                            {
                                var possibleNames = new[]
                                {
                                    $"diffuse_{matName}.png",
                                    $"diffuse_{matName}.jpg",
                                    $"{matName}.png",
                                    $"{matName}.jpg",
                                    $"{matName}_diffuse.png"
                                };
                                
                                foreach (var name in possibleNames)
                                {
                                    if (textureCache.TryGetValue(name, out tex))
                                        break;
                                }
                            }
                            
                            var pbrMat = new PbrMaterial
                            {
                                Name = matName,
                                MetallicFactor = 0.0,
                                RoughnessFactor = 0.5
                            };
                            
                            if (tex != null)
                            {
                                pbrMat.AlbedoTexture = tex;
                                pbrMat.Albedo = new Vector3(1.0, 1.0, 1.0);
                                Console.WriteLine($"  ✓ {matName} → {tex.FileName}");
                            }
                            else
                            {
                                pbrMat.Albedo = new Vector3(0.8, 0.8, 0.8);
                                Console.WriteLine($"  ⚠ {matName} → no texture found");
                            }
                            
                            newNode.Material = pbrMat;
                        }
                        return true;
                    });
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"  ✗ Failed to load {matName}: {ex.Message}");
                }
            }
            
            // Use the combined scene
            scene = combinedScene;
        }
        else
        {
            // Single material or no material switches - use standard loading
            Console.WriteLine($"Single material model ({uniqueMaterials.Count} unique material) - using standard loading");
            
            var loadOptions = new ObjLoadOptions
            {
                EnableMaterials = true,
                FlipCoordinateSystem = true,
                LookupPaths = new List<string> { tempPath }
            };

            scene = Scene.FromFile(objFile, loadOptions);
            
            // Remove collision meshes
            Console.WriteLine("  Removing collision meshes...");
            var nodesToRemove = new List<Node>();
            scene.RootNode.Accept(n =>
            {
                if (n.Name != null && (
                        n.Name.StartsWith("UCX_", StringComparison.OrdinalIgnoreCase) ||
                        n.Name.StartsWith("UBX_", StringComparison.OrdinalIgnoreCase) ||
                        n.Name.StartsWith("USP_", StringComparison.OrdinalIgnoreCase) ||
                        n.Name.StartsWith("UCP_", StringComparison.OrdinalIgnoreCase)))
                {
                    nodesToRemove.Add(n);
                    Console.WriteLine($"    Removing: {n.Name}");
                }
                return true;
            });
            
            foreach (var nodeToRemove in nodesToRemove)
                nodeToRemove.ParentNode?.ChildNodes.Remove(nodeToRemove);
            
            Console.WriteLine($"  Removed {nodesToRemove.Count} collision meshes");
            
            var fallbackTexture = textureCache.Count == 1 ? textureCache.Values.First() : 
                                 textureCache.Values.FirstOrDefault(t => t.FileName.StartsWith("diffuse_", StringComparison.OrdinalIgnoreCase));
            
            scene.RootNode.Accept(n =>
            {
                if (n.Entity is Mesh mesh)
                {
                    Console.WriteLine($"  Processing mesh: {n.Name ?? "(unnamed)"}");
                    
                    if (mesh.GetElement(VertexElementType.Normal) == null)
                    {
                        PolygonModifier.GenerateNormal(mesh);
                        Console.WriteLine($"    Generated normals");
                    }
                    if (mesh.GetElement(VertexElementType.UV) == null)
                    {
                        PolygonModifier.GenerateUV(mesh);
                        Console.WriteLine($"    Generated UVs");
                    }

                    var materialName = n.Material?.Name ?? "";
                    Console.WriteLine($"    Material name: '{materialName}'");
                    Texture? textureToApply = null;
                    
                    // Try to find matching texture
                    if (!string.IsNullOrEmpty(materialName))
                    {
                        if (mtlMappings.TryGetValue(materialName, out var texName))
                        {
                            textureCache.TryGetValue(texName, out textureToApply);
                            if (textureToApply != null)
                                Console.WriteLine($"    MTL mapping found: {texName}");
                        }
                        
                        if (textureToApply == null)
                        {
                            var possibleNames = new[]
                            {
                                $"diffuse_{materialName}.png",
                                $"diffuse_{materialName}.jpg",
                                $"{materialName}.png",
                                $"{materialName}.jpg"
                            };
                            
                            foreach (var name in possibleNames)
                            {
                                if (textureCache.TryGetValue(name, out textureToApply))
                                {
                                    Console.WriteLine($"    Name match: {name}");
                                    break;
                                }
                            }
                        }
                    }
                    
                    // Fall back to any available texture for single-texture models
                    if (textureToApply == null && fallbackTexture != null)
                    {
                        textureToApply = fallbackTexture;
                        Console.WriteLine($"    Using fallback: {fallbackTexture.FileName}");
                    }
                    
                    var pbrMat = new PbrMaterial
                    {
                        Name = string.IsNullOrEmpty(materialName) ? "DefaultMaterial" : materialName,
                        MetallicFactor = 0.0,
                        RoughnessFactor = 0.5
                    };
                    
                    if (textureToApply != null)
                    {
                        pbrMat.AlbedoTexture = textureToApply;
                        pbrMat.Albedo = new Vector3(1.0, 1.0, 1.0);
                        Console.WriteLine($"  ✅ Applied texture: {textureToApply.FileName}");
                    }
                    else
                    {
                        pbrMat.Albedo = new Vector3(0.8, 0.8, 0.8);
                        Console.WriteLine($"  ⚠ No texture - using gray");
                    }
                    
                    n.Material = pbrMat;
                }
                return true;
            });
        }

        // Save GLB
        var filename = $"{Guid.NewGuid()}.glb";
        var outputDir = Path.Combine(_environment.WebRootPath, "uploads", "previews");
        Directory.CreateDirectory(outputDir);
        var outputPath = Path.Combine(outputDir, filename);

        var saveOptions = new GltfSaveOptions(FileFormat.GLTF2_Binary)
        {
            EmbedAssets = true,
            SaveExtras = false,
            FlipTexCoordV = true
        };

        scene.Save(outputPath, saveOptions);
        Console.WriteLine($"\n✅ Saved: {filename}");

        return filename;
    }
    finally
    {
        if (Directory.Exists(tempPath))
            try { Directory.Delete(tempPath, true); } catch { }
    }
}
}