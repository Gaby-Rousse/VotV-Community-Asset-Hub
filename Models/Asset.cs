namespace VotVAssets.Models;

public enum ItemEnum
{
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
}