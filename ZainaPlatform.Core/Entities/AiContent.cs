namespace ZainaPlatform.Core.Entities;

public class AiContent
{
    public int Id { get; set; }
    public int WeekId { get; set; }
    public string LessonCardEn { get; set; } = string.Empty;
    public string LessonCardAr { get; set; } = string.Empty;
    public string KeyFacts { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public string Enrichment { get; set; } = string.Empty;
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    public Week Week { get; set; } = null!;
    public ICollection<QuizQuestion> QuizQuestions { get; set; } = new List<QuizQuestion>();
}
