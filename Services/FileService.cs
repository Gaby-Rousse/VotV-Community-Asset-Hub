namespace VotVAssets.Services;
using SixLabors.ImageSharp;
using Image = SixLabors.ImageSharp.Image;
using SixLabors.ImageSharp.Processing;
using SixLabors.ImageSharp.PixelFormats;
using SixLabors.ImageSharp.Formats.Webp;
using System.Diagnostics;
using Aspose.Zip;
using Aspose.Zip.ArchiveInfo;
using Microsoft.AspNetCore.StaticFiles;
using Amazon.S3;
using Amazon.S3.Model;
using Models;
using Models.Enums;


public class FileService(IWebHostEnvironment environment, IAmazonS3 s3Client)
{
    private const int MaxImageDimension = 8000;
    private static async Task<Image<Rgba32>?> LoadValidatedImage(IFormFile file)
    {
        try
        {
            await using var stream = file.OpenReadStream();

            var info = await Image.IdentifyAsync(stream);
            if (info.Width > MaxImageDimension || info.Height > MaxImageDimension)
                return null;

            stream.Position = 0;
            return await Image.LoadAsync<Rgba32>(stream);
        }
        catch (ImageFormatException)
        {
            return null;
        }
    }

    //I HATE AMAZON DAWGSHIT DOCUMENTATION
    //HERE THE CLOUDFLARE SNIPPETS THAT ARE SO USELESS BUT BETTER THAN USING AI
    //FilePath = Path toward the file stored on the SERVER (this api)
    //Key = The destination, in the bucket
    //DisablePayloadSigning and DisableDefaultChecksumValidation are both true in Cloudflare snippet
    //I don't know why.
    async Task PutObject(string filePath, string key, bool isExplicit = false)
    {
        await s3Client.PutObjectAsync(new PutObjectRequest
        {
            FilePath = filePath,
            Key = $"VCAH/{key}",
            BucketName = isExplicit ? "vcah-explicit" : "votvbroadcast",
            DisablePayloadSigning = true,
            DisableDefaultChecksumValidation = true
        });
    }

    async Task DeleteObject(string key, bool isExplicit)
    {
        await s3Client.DeleteObjectAsync(new DeleteObjectRequest
        {
            Key = $"VCAH/{key}",
            BucketName = isExplicit ? "vcah-explicit" : "votvbroadcast"
        });
    }

    public async Task DeleteFileAsync(string key)
    {
        if (string.IsNullOrEmpty(Path.GetFileName(key))) return;

        var local = Path.Combine(environment.ContentRootPath, "wwwroot", key);
        if (File.Exists(local)) File.Delete(local);

        await DeleteObject(key, false);
        await DeleteObject(key, true);
    }

    public async Task SyncBucket(Asset asset, bool wasExplicit)
    {
        bool isExplicit = asset.Rating == ContentRating.Explicit;
        if (!isExplicit && !wasExplicit) return;

        string[] keys =
        [
            $"uploads/files/{asset.Filename}",
            $"uploads/thumbnails/{asset.Thumbnail}",
            $"uploads/previews/{asset.Preview}"
        ];

        foreach (var key in keys)
        {
            var local = Path.Combine(environment.ContentRootPath, "wwwroot", key);
            if (!File.Exists(local)) continue;

            await PutObject(local, key, isExplicit);
            await DeleteObject(key, !isExplicit);
        }
    }

    public async Task PromoteTempAsync(string folder, string fileName)
    {
        var root = Path.Combine(environment.ContentRootPath, "wwwroot");
        var tempKey = $"temp_uploads/{folder}/{fileName}";
        var finalKey = $"uploads/{folder}/{fileName}";

        File.Move(Path.Combine(root, tempKey), Path.Combine(root, finalKey));
        await PutObject(Path.Combine(root, finalKey), finalKey);
        await DeleteObject(tempKey, false);
    }

    //List from here: https://docs.aspose.net/zip/developer-guide/universal-extractor/
    Dictionary<ArchiveFormat,string> supportedFormats = new()
    {
        [ArchiveFormat.Zip] = ".zip",
        [ArchiveFormat.Rar] = ".rar",
        [ArchiveFormat.SevenZip] = ".7z",
        [ArchiveFormat.Tar] = ".tar",
        [ArchiveFormat.Gzip] = ".gz",
        [ArchiveFormat.Bzip2] = ".bz2"
    };

    private static readonly FileExtensionContentTypeProvider ContentTypes = new();
    private static bool IsImageFile(string filename) =>
        ContentTypes.TryGetContentType(filename, out var type)
        && type.StartsWith("image/", StringComparison.OrdinalIgnoreCase);

    public async Task<string?> HandlePfp(IFormFile? avatar, bool temp = false)
    {
        if (avatar == null) return null;

        using var image = await LoadValidatedImage(avatar);
        if (image == null) return "INVALID_TYPE";

        var keyFolder = Path.Combine(temp ? "temp_uploads" : "uploads", "avatars");
        var fileName = $"{Guid.NewGuid()}.webp";
        var fullPath = Path.Combine(environment.ContentRootPath, "wwwroot", keyFolder, fileName);

        ResizeImage2(image, fullPath);
        await PutObject(fullPath, Path.Combine(keyFolder, fileName));
        return fileName;
    }

    public async Task<string?> HandleThumbnail(IFormFile? thumbnail, bool temp = false)
    {
        if (thumbnail == null) return null;

        using var image = await LoadValidatedImage(thumbnail);
        if (image == null) return "INVALID_TYPE";

        var keyFolder = Path.Combine(temp ? "temp_uploads" : "uploads", "thumbnails");
        var fileName = $"{Guid.NewGuid()}.webp";
        var fullPath = Path.Combine(environment.ContentRootPath, "wwwroot", keyFolder, fileName);

        TrimTransparentImage(image, fullPath);
        await PutObject(fullPath, Path.Combine(keyFolder, fileName));
        return fileName;
    }

    public async Task<string?> HandlePreview(IFormFile? preview, bool temp = false)
    {
        if (preview == null) return null;

        string ext = Path.GetExtension(preview.FileName);
        if (!string.Equals(ext, ".glb", StringComparison.OrdinalIgnoreCase))
            return "INVALID_TYPE";

        var rootPath = environment.ContentRootPath;
        var keyFolder = Path.Combine(temp ? "temp_uploads" : "uploads", "previews");
        var uploadFolder = Path.Combine(rootPath, "wwwroot", keyFolder);

        var fileName = $"{Guid.NewGuid()}{Path.GetExtension(preview.FileName)}";
        var fullPath = Path.Combine(uploadFolder, fileName);

        await using (var stream = new FileStream(fullPath, FileMode.Create))
        {
            await preview.CopyToAsync(stream);
        }


        string r2Path = Path.Combine(keyFolder, fileName);
        await PutObject(fullPath, r2Path);

        return fileName;
    }

    public async Task<string?> HandleATVPreview(string? textureFilename, string? path, bool temp = false)
    {
        if (string.IsNullOrEmpty(textureFilename) && string.IsNullOrEmpty(path)) return null;

        var rootPath = environment.ContentRootPath;
        string previewName = $"{Guid.NewGuid()}.glb";
        string texturePath;
        if (!string.IsNullOrEmpty(textureFilename))
            texturePath = Path.Combine(rootPath, "wwwroot", "uploads", "files", textureFilename);
        else
            texturePath = path;
        if (!File.Exists(texturePath)) return null;
        if (!IsImageFile(texturePath))
            return path != null ? "INVALID_TYPE" : null;

        var keyFolder = Path.Combine(temp ? "temp_uploads" : "uploads", "previews");
        var destinationFolder = Path.Combine(rootPath, "wwwroot", keyFolder);
        var scriptPath = Path.Combine(rootPath, "blender", "patch.py");
        var blendPath  = Path.Combine(rootPath, "blender", "scene.blend");

        var outputPath = Path.Combine(destinationFolder, previewName);

        var psi = new ProcessStartInfo("/opt/blender-5.0.1-linux-x64/blender",
            $"--background \"{blendPath}\" --python \"{scriptPath}\" -- \"{texturePath}\" \"{outputPath}\"")
        {
            RedirectStandardOutput = true,
            RedirectStandardError  = true
        };

        using var proc = Process.Start(psi)!;
        await proc.WaitForExitAsync();

        if (proc.ExitCode != 0) return null;

        string r2Path = Path.Combine(keyFolder, previewName);
        await PutObject(outputPath, r2Path);

        return previewName;
    }

    public async Task<string?> HandleATVPreviewFromForm(IFormFile? texture, bool temp = false)
    {
        if (texture == null || texture.Length == 0) return null;

        if (!texture.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
            return "INVALID_TYPE";

        var ext = Path.GetExtension(texture.FileName).ToLowerInvariant();
        var tempPath = Path.Combine(Path.GetTempPath(), $"{Guid.NewGuid()}{ext}");

        try
        {
            await using (var fs = File.Create(tempPath))
            {
                await texture.CopyToAsync(fs);
            }

            return await HandleATVPreview(null, tempPath, temp);
        }
        finally
        {
            try { await DeleteFileAsync(tempPath); } catch { /* idc */ }
        }
    }

    public async Task<string?> HandleModelPreview(string zipFilename)
    {
        if (zipFilename == null)
            return null;

        var rootPath = environment.ContentRootPath;
        var zipPath = Path.Combine(rootPath, "wwwroot", "uploads", "files", zipFilename);
        if (!System.IO.File.Exists(zipPath)) return null;

        ArchiveFormatInfo AII = ArchiveInstanceInfo.GetArchiveFormatInfo(zipPath);
        if(AII == null) return null;

        if (!supportedFormats.ContainsKey(AII.Format))
            return null;

        var extractFolder = Path.Combine(rootPath, "wwwroot", "temp_uploads",
            $"model_{Path.GetFileNameWithoutExtension(zipFilename)}");

        try
        {
            if (Directory.Exists(extractFolder)) Directory.Delete(extractFolder, true);

            using (IArchive archive = ArchiveFactory.GetArchive(zipPath))
            {
                archive.ExtractToDirectory(extractFolder);
            }

            var objPath = Directory
                .EnumerateFiles(extractFolder, "*.obj", SearchOption.AllDirectories)
                .FirstOrDefault();
            if (objPath == null) return null;

            // Prefer the diffuse/albedo texture; skip icons; otherwise fall back to any .png.
            var pngs = Directory
                .EnumerateFiles(extractFolder, "*.png", SearchOption.AllDirectories)
                .ToList();

            var texturePath = pngs.FirstOrDefault(p =>
                                  Path.GetFileName(p).Contains("diffuse", StringComparison.OrdinalIgnoreCase))
                              ?? pngs.FirstOrDefault(p =>
                                  !Path.GetFileName(p).Contains("icon", StringComparison.OrdinalIgnoreCase))
                              ?? pngs.FirstOrDefault();
            if (texturePath == null) return null;

            string previewName = $"{Guid.NewGuid()}.glb";
            var keyFolder = Path.Combine("uploads", "previews");
            var outputPath = Path.Combine(rootPath, "wwwroot", keyFolder, previewName);
            var scriptPath = Path.Combine(rootPath, "blender", "model.py");

            var psi = new ProcessStartInfo("/opt/blender-5.0.1-linux-x64/blender",
                $"--background --factory-startup --python \"{scriptPath}\" -- \"{objPath}\" \"{texturePath}\" \"{outputPath}\"")
            {
                RedirectStandardOutput = true,
                RedirectStandardError = true
            };

            using var proc = Process.Start(psi)!;
            await proc.WaitForExitAsync();

            if (proc.ExitCode != 0 || !System.IO.File.Exists(outputPath)) return null;

            string r2Path = Path.Combine(keyFolder, previewName);
            await PutObject(outputPath, r2Path);

            return previewName;
        }
        catch
        {
            return null;
        }
        finally
        {
            if (Directory.Exists(extractFolder)) Directory.Delete(extractFolder, true);
        }
    }


    public async Task<string?> HandleFile(IFormFile? file)
    {
        if (file == null) return null;

        var rootPath = environment.ContentRootPath;
        var keyFolder = Path.Combine("uploads", "files");
        var uploadFolder = Path.Combine(rootPath, "wwwroot", keyFolder);

        var fileName = $"{Guid.NewGuid()}";

        Image? image = null;
        try
        {
            image = await LoadValidatedImage(file);
        }
        catch (ImageFormatException)
        {
            // Not an image, handled below as an archive
        }

        if (image != null)
        {
            using (image)
            {
                fileName += ".png";
                var fullPath = Path.Combine(uploadFolder, fileName);
                await image.SaveAsPngAsync(fullPath);
                string r2Path = Path.Combine(keyFolder, fileName);
                await PutObject(fullPath, r2Path);

                return fileName;
            }
        }

        ArchiveFormatInfo AII = ArchiveInstanceInfo.GetArchiveFormatInfo(file.OpenReadStream());
        if(AII == null)
            return "INVALID_TYPE"; //fishy
        if (!supportedFormats.ContainsKey(AII.Format))
            return "INVALID_TYPE";

        fileName += supportedFormats.GetValueOrDefault(AII.Format);
        var fullPath2 = Path.Combine(uploadFolder, fileName);
        await using (var stream = new FileStream(fullPath2, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }
        string r2Path2 = Path.Combine(keyFolder, fileName);
        await PutObject(fullPath2, r2Path2);
        return fileName;
    }

    public long HandleFilesize(string fileName)
    {
        var rootPath = environment.ContentRootPath;
        var path = Path.Combine(rootPath, "wwwroot", "uploads", "files", fileName);
        long length = new System.IO.FileInfo(path).Length;
        return length;
    }

    public void TrimTransparentImage(Image<Rgba32> image, string outputPath)
    {
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

        ResizeImage2(image, outputPath);
    }

    void ResizeImage(string inputPath, string outputPath)
    {
        using var image = Image.Load<Rgba32>(inputPath);
        image.Mutate(ctx => ctx.Resize(new ResizeOptions
        {
            Size = new Size(Math.Min(image.Width,800), 0),
            Mode = ResizeMode.Max
        }));
        var encoder = new WebpEncoder { Quality = 75 };
        image.SaveAsWebp(outputPath,encoder);
    }

    void ResizeImage2(Image image,  string outputPath)
    {
        image.Mutate(ctx => ctx.Resize(new ResizeOptions
        {
            Size = new Size(Math.Min(image.Width,800), 0),
            Mode = ResizeMode.Max
        }));
        var encoder = new WebpEncoder { Quality = 75 };
        image.SaveAsWebp(outputPath,encoder);
    }
}