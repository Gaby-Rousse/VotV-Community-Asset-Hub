namespace VotVAssets.Models;

public class Artist : Timestamp
{
    public long Id { get; set; }
    public string? OwnerId { get; set; }

    required
        public string Name { get; set; }

    public string? Description { get; set; }
    public string[]? Socials { get; set; }
    public string? Pfp { get; set; }

    public string PfpUrl => string.IsNullOrEmpty(Pfp)
        ? "/uploads/avatars/defaultPicture.png"
        : $"/uploads/avatars/{Pfp}";
}