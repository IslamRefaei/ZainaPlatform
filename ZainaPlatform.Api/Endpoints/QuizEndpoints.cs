using Microsoft.EntityFrameworkCore;
using ZainaPlatform.Infrastructure.Data;
using ZainaPlatform.Core.Entities;

namespace ZainaPlatform.Api.Endpoints;

public static class QuizEndpoints
{
    private static bool IsAnswerCorrect(string selected, string correct)
    {
        selected = selected.Trim().ToLower();
        correct = correct.Trim().ToLower();
        return selected == correct
            || selected.Contains(correct)
            || correct.Contains(selected);
    }

    public static void MapQuizEndpoints(this WebApplication app)
    {
        app.MapGet("/api/quiz/{weekId}", async (int weekId, ZainaDbContext db) =>
        {
            var aiContent = await db.AiContents
                .Include(a => a.QuizQuestions)
                .FirstOrDefaultAsync(a => a.WeekId == weekId);

            if (aiContent == null)
                return Results.NotFound("No AI content found for this week");

            var questions = aiContent.QuizQuestions.Select(q => new
            {
                q.Id,
                q.QuestionText,
                q.QuestionType,
                q.Options,
                q.Difficulty,
                q.Language
            }).ToList();

            return Results.Ok(new
            {
                WeekId = weekId,
                AiContentId = aiContent.Id,
                TotalQuestions = questions.Count,
                Questions = questions
            });
        })
        .WithName("GetQuiz")
        .WithOpenApi();

        app.MapPost("/api/quiz/{weekId}/submit", async (
            int weekId,
            SubmitQuizRequest request,
            ZainaDbContext db) =>
        {
            var aiContent = await db.AiContents
                .Include(a => a.QuizQuestions)
                .FirstOrDefaultAsync(a => a.WeekId == weekId);

            if (aiContent == null)
                return Results.NotFound("No AI content found for this week");

            var results = new List<QuestionResult>();
            int correct = 0;

            foreach (var answer in request.Answers)
            {
                var question = aiContent.QuizQuestions
                    .FirstOrDefault(q => q.Id == answer.QuestionId);

                if (question == null) continue;

                var isCorrect = IsAnswerCorrect(answer.SelectedAnswer, question.CorrectAnswer);
                if (isCorrect) correct++;

                results.Add(new QuestionResult
                {
                    QuestionId = question.Id,
                    QuestionText = question.QuestionText,
                    SelectedAnswer = answer.SelectedAnswer,
                    CorrectAnswer = question.CorrectAnswer,
                    IsCorrect = isCorrect,
                    Explanation = question.Explanation,
                    Difficulty = question.Difficulty
                });
            }

            var totalQuestions = request.Answers.Count;
            var scorePercent = totalQuestions > 0
                ? Math.Round((decimal)correct / totalQuestions * 100, 1)
                : 0;

            var wrongTopics = results
                .Where(r => !r.IsCorrect)
                .Select(r => r.QuestionText)
                .ToList();

            var attempt = new QuizAttempt
            {
                AiContentId = aiContent.Id,
                StartedAt = request.StartedAt,
                CompletedAt = DateTime.UtcNow,
                TotalScore = scorePercent,
                DurationSeconds = (int)(DateTime.UtcNow - request.StartedAt).TotalSeconds,
                Answers = System.Text.Json.JsonSerializer.Serialize(results)
            };

            db.QuizAttempts.Add(attempt);
            await db.SaveChangesAsync();

            var passed = scorePercent >= 70;

            return Results.Ok(new
            {
                AttemptId = attempt.Id,
                Score = scorePercent,
                Correct = correct,
                Total = totalQuestions,
                Passed = passed,
                Message = passed ? "Great job! You passed! 🎉" : "Keep trying! You can do it! 💪",
                NeedsReExplanation = !passed,
                WrongTopics = wrongTopics,
                Results = results
            });
        })
        .WithName("SubmitQuiz")
        .WithOpenApi();
    }
}

public record SubmitQuizRequest(
    List<QuizAnswer> Answers,
    DateTime StartedAt);

public record QuizAnswer(
    int QuestionId,
    string SelectedAnswer);

public class QuestionResult
{
    public int QuestionId { get; set; }
    public string QuestionText { get; set; } = "";
    public string SelectedAnswer { get; set; } = "";
    public string CorrectAnswer { get; set; } = "";
    public bool IsCorrect { get; set; }
    public string Explanation { get; set; } = "";
    public string Difficulty { get; set; } = "";
}
