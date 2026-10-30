namespace VotVAssets.Models;
using Enums;

public enum ItemEnum
{
    All = -1,
    Rug,
    Picture,
    Flag,
    Sticker,
    Poster,
    Model,
    Atv
}

public enum TypeEnum
{
    Horizontal,
    Square,
    Vertical,
    Table
}

public class Asset : Timestamp
{
    public long Id { get; set; }
    public required string? OwnerId { get; set; }
    public required long ArtistId { get; set; }
    public required string Name { get; set; }
    public required string Filename { get; set; }
    public required ItemEnum  Item { get; set; }
    public required ContentRating Rating { get; set; } = ContentRating.General;

    public string? Description { get; set; }
    public string? Thumbnail { get; set; }
    public string? Source { get; set; }

    public ICollection<Tag> Tags { get; set; } = [];
    public TypeEnum? Type { get; set; }

    public string? Preview { get; set; }

    public string PreviewUrl => string.IsNullOrEmpty(Preview)
        ? "NOT_AVAILABLE"
        : $"https://cdn.votvbroadcast.com/VCAH/uploads/previews/{Preview}";
    
    public string ThumbnailUrl => string.IsNullOrEmpty(Thumbnail)
        ? "/uploads/thumbnails/picture.png"
        : Thumbnail.StartsWith("temp/")
            ? $"https://cdn.votvbroadcast.com/VCAH/temp_uploads/thumbnails/{Thumbnail.Substring(4)}"
            : $"https://cdn.votvbroadcast.com/VCAH/uploads/thumbnails/{Thumbnail}";
    
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
    
    public Artist? Artist { get; set; }
    
}

