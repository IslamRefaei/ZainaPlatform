namespace ZainaPlatform.Core.Entities;

public class Subject
{
    public int Id { get; set; }
    public int TermId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Language { get; set; } = "EN";
    public string ColorCode { get; set; } = "#1B4F8A";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public Term Term { get; set; } = null!;
    public ICollection<Week> Weeks { get; set; } = new List<Week>();
}
