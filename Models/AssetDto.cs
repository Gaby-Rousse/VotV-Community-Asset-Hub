namespace VotVAssets.Models;

public class AssetDto : Timestamp
{
    public long Id { get; set; }

    required
        public string? OwnerId { get; set; }

    required
        public long ArtistId { get; set; }

    required
        public string Name { get; set; }

    required
        public string Filename { get; set; }

    required
        public ItemEnum Item { get; set; }

    public string? Description { get; set; }
    public string? Thumbnail { get; set; }
    public string? Source { get; set; }

    public string[]? Tags { get; set; }
    public TypeEnum? Type { get; set; }

    public string ArtistName { get; set; }

    public string? Preview { get; set; }

    public string PreviewUrl => string.IsNullOrEmpty(Preview)
        ? "NOT_AVAILABLE"
        : $"http://10.0.0.131:5130/uploads/previews/{Preview}";

    public string ThumbnailUrl => string.IsNullOrEmpty(Thumbnail)
        ? "http://10.0.0.131:5130/uploads/thumbnails/picture.png"
        : $"http://10.0.0.131:5130/uploads/thumbnails/{Thumbnail}";

    public string FileUrl => $"http://10.0.0.131:5130/uploads/files/{Filename}";
}