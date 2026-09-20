namespace ZainaPlatform.Core.Entities;

public class Term
{
    public int Id { get; set; }
    public int AcademicYearId { get; set; }
    public string Label { get; set; } = string.Empty;
    public int TermNumber { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public AcademicYear AcademicYear { get; set; } = null!;
    public ICollection<Subject> Subjects { get; set; } = new List<Subject>();
}
