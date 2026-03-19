namespace VotVAssets.Models;

public class Edit : Timestamp
{
    public long Id { get; set;}
    public required string SubmittedById { get; set; }
    
    public required string Changes { get; set;  }
    public required long TargetId { get; set; }
    public required Table Table { get; set; }
}

public enum Table
{
    Asset,
    Artist,
}