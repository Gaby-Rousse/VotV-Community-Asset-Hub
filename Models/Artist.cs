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
        ? "http://10.0.0.131:5130/uploads/avatars/defaultPicture.png"
        : $"http://10.0.0.131:5130/uploads/avatars/{Pfp}";
}