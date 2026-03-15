namespace VotVAssets.Models;

public class Tag
{
    public long Id { get; set; }
    public required string Name { get; set; }

    public ICollection<Asset> Assets { get; set; } = [];
}