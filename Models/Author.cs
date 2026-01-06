namespace VotVAssets.Models;

public class Author : Timestamp
{
    public long Id { get; set; }
    
    required
        public string Name {get; set;}
    public string? Description { get; set; }
    public string[]? Socials {get; set;}
}