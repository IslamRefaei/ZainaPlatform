namespace ZainaPlatform.Core.Entities;

public class QuizQuestion
{
    public int Id { get; set; }
    public int AiContentId { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public string QuestionType { get; set; } = "mcq";
    public string Options { get; set; } = "[]";
    public string CorrectAnswer { get; set; } = string.Empty;
    public string Explanation { get; set; } = string.Empty;
    public string Difficulty { get; set; } = "medium";
    public string Language { get; set; } = "EN";
    public AiContent AiContent { get; set; } = null!;
}
