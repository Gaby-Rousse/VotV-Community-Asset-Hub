namespace VotVAssets.Models;
using System.ComponentModel.DataAnnotations.Schema;

public class Artist : Timestamp
{
    public long Id { get; set; }
    public string? OwnerId { get; set; }
    public required string Name { get; set; }

    public string? Description { get; set; }
    public string[]? Socials { get; set; }
    public string? Pfp { get; set; }

    public string PfpUrl => string.IsNullOrEmpty(Pfp)
        ? "https://cdn.votvbroadcast.com/VCAH/uploads/avatars/defaultPicture.png"
        : Pfp.StartsWith("temp/")
            ? $"https://cdn.votvbroadcast.com/VCAH/temp_uploads/avatars/{Pfp.Substring(4)}"
            : $"https://cdn.votvbroadcast.com/VCAH/uploads/avatars/{Pfp}";
    
    public virtual ICollection<Asset> Assets { get; set; } = new List<Asset>();

    [NotMapped]
    public int AssetCount { get; set; }
}