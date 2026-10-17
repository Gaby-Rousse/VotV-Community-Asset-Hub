namespace VotVAssets.Models;

public class Tag
{
    public long Id { get; set; }
    public required string Name { get; set; }
    public string? Thumbnail { get; set; }
    public string ThumbnailUrl => string.IsNullOrEmpty(Thumbnail)
        ? "/uploads/thumbnails/picture.png"
        : $"https://cdn.votvbroadcast.com/VCAH/uploads/thumbnails/{Thumbnail}";

    public string? Description { get; set; }

    public ICollection<Asset> Assets { get; set; } = [];
}