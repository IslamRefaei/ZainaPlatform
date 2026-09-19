namespace ZainaPlatform.Core.Entities;

public class Week
{
    public int Id { get; set; }
    public int SubjectId { get; set; }
    public int WeekNumber { get; set; }
    public string Label { get; set; } = string.Empty;
    public string Status { get; set; } = "NotStarted";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public Subject Subject { get; set; } = null!;
    public ICollection<SourceFile> SourceFiles { get; set; } = new List<SourceFile>();
    public AiContent? AiContent { get; set; }
}
