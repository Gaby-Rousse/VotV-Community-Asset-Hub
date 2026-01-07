namespace VotVAssets.Models;

public class Artist : Timestamp
{
    public long Id { get; set; }

    required
        public string Name { get; set; }

    public string? Description { get; set; }
    public string[]? Socials { get; set; }
    public string? Pfp { get; set; }

    public string PfpUrl => string.IsNullOrEmpty(Pfp)
        ? "/default.png"
        : $"http://url/uploads/avatars/{Pfp}";
}