namespace VotVAssets.Models;

public class Rating
{
    required
    public string UserId { get; set; }
    required
    public long AssetId { get; set; }
    required
    public int Value { get; set; }
}