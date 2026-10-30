namespace VotVAssets.Models.Queries;
using VotVAssets.Models.Enums;
public class GetAssetsQuery
{
    public ItemEnum? Item { get; set; }
    public int? Type { get; set; }
    public string? Search { get; set; }
    public SearchBy SearchBy { get; set; } = SearchBy.Name;
    public string? Tags { get; set; }
    public SortBy Sort { get; set; } = SortBy.Date;
    public bool Reverse { get; set; }
    public string? OwnerId { get; set; }
    public int Page { get; set; } = 1;
    public ContentRating[] Ratings { get; set; } = [ContentRating.General];
}