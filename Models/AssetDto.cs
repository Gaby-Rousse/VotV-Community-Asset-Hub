namespace VotVAssets.Models;

public class AssetDto : Timestamp
{
    public long Id { get; set; }

    required
        public string? OwnerId { get; set; }

    required
        public string Name { get; set; }

    required
        public string Filename { get; set; }

    required
        public ItemEnum Item { get; set; }
    
    required 
        public Artist Artist { get; set; }

    public string? Description { get; set; }
    public string? Thumbnail { get; set; }
    public string? Source { get; set; }

    public string[]? Tags { get; set; }
    public TypeEnum? Type { get; set; }

    public string? Preview { get; set; }

    public string PreviewUrl => string.IsNullOrEmpty(Preview)
        ? "NOT_AVAILABLE"
        : $"/uploads/previews/{Preview}";

    public string ThumbnailUrl => string.IsNullOrEmpty(Thumbnail)
        ? "/uploads/thumbnails/picture.png"
        : $"/uploads/thumbnails/{Thumbnail}";

    public string FileUrl => $"/uploads/files/{Filename}";
    public long? RawSize { get; set; }
    
    public string Size => RawSize != null ? BytesToString(RawSize.Value) : "N/A";
    static string BytesToString(long byteCount)
    {
        string[] suf = { "B", "KB", "MB", "GB", "TB", "PB", "EB" };
        if (byteCount == 0)
            return "0" + suf[0];
        long bytes = Math.Abs(byteCount);
        int place = Convert.ToInt32(Math.Floor(Math.Log(bytes, 1024)));
        double num = Math.Round(bytes / Math.Pow(1024, place), 1);
        return (Math.Sign(byteCount) * num).ToString() + suf[place];
    }
}