namespace ZainaPlatform.Core.Entities;

public class QuizAttempt
{
    public int Id { get; set; }
    public int AiContentId { get; set; }
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
    public decimal TotalScore { get; set; }
    public string Answers { get; set; } = "{}";
    public int DurationSeconds { get; set; }
    public AiContent AiContent { get; set; } = null!;
}
