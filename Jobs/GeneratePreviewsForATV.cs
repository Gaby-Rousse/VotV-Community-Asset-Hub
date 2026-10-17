using VotVAssets.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.PixelFormats;
using SixLabors.ImageSharp.Processing;
using System.Diagnostics;
public static class GeneratePreviewsForATV
{
    public static async Task RunAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var environment = scope.ServiceProvider.GetRequiredService<IWebHostEnvironment>();
        var rootPath = environment.ContentRootPath;

        var assets = await context.Assets
            .Where(a => a.Item == ItemEnum.Atv && a.Preview == null).ToListAsync();

        Console.WriteLine($"Found {assets.Count} assets to process...");

        foreach (Asset asset in assets)
        {
            Console.WriteLine($"Working on: {asset.Name}");
            string previewName = $"{Guid.NewGuid()}.glb";
            var texturePath = Path.Combine(rootPath, "wwwroot", "uploads", "files", asset.Filename);
            var destinationFolder = Path.Combine(rootPath, "wwwroot", "uploads", "previews");
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
            asset.Preview = previewName;
            Console.WriteLine($"Finished working on: {asset.Name}");
        }

        await context.SaveChangesAsync();
        Console.WriteLine("Done.");
    }
}