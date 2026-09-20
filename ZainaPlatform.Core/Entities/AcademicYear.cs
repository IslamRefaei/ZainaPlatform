namespace ZainaPlatform.Core.Entities;

public class AcademicYear
{
    public int Id { get; set; }
    public string Label { get; set; } = string.Empty;
    public int StartYear { get; set; }
    public int EndYear { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<Term> Terms { get; set; } = new List<Term>();
}
