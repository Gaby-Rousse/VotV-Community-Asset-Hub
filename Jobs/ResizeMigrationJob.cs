using VotVAssets.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.PixelFormats;
using SixLabors.ImageSharp.Processing;
public static class ResizeMigrationJob
{
    public static async Task RunAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var uploadsPath = Path.Combine("wwwroot", "uploads", "thumbnails");

        var assets = await context.Assets
            .Where(a => a.Thumbnail != null && !a.Thumbnail.EndsWith(".webp"))
            .ToListAsync();

        Console.WriteLine($"Found {assets.Count} assets to process...");

        foreach (var asset in assets)
        {
            try
            {
                var inputPath = Path.Combine(uploadsPath, asset.Thumbnail!);
                var webpFilename = Path.ChangeExtension(asset.Thumbnail, ".webp");
                var outputPath = Path.Combine(uploadsPath, webpFilename);

                using var image = Image.Load<Rgba32>(inputPath);
                image.Mutate(ctx => ctx.Resize(new ResizeOptions
                {
                    Size = new Size(800, 0),
                    Mode = ResizeMode.Max
                }));
                image.SaveAsWebp(outputPath, new WebpEncoder { Quality = 75 });

                // inputPath = "image.png", outputPath = "image.webp" — safe to delete
                if (File.Exists(inputPath))
                    File.Delete(inputPath);

                asset.Thumbnail = webpFilename;
                Console.WriteLine($"✓ {asset.Name} ({asset.Thumbnail} → {webpFilename})");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"✗ {asset.Name}: {ex.Message}");
            }
        }

        await context.SaveChangesAsync();
        Console.WriteLine("Done.");
    }
}