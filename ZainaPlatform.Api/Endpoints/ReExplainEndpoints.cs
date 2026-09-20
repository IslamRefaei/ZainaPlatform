using Microsoft.EntityFrameworkCore;
using ZainaPlatform.Api.Services;
using ZainaPlatform.Infrastructure.Data;

namespace ZainaPlatform.Api.Endpoints;

public static class ReExplainEndpoints
{
    public static void MapReExplainEndpoints(this WebApplication app)
    {
        app.MapPost("/api/weeks/{weekId}/reexplain", async (
            int weekId,
            ReExplainRequest request,
            ZainaDbContext db,
            AiGenerationService aiService) =>
        {
            var aiContent = await db.AiContents
                .Include(a => a.QuizQuestions)
                .FirstOrDefaultAsync(a => a.WeekId == weekId);

            if (aiContent == null)
                return Results.NotFound("No AI content found for this week");

            var sourceFile = await db.SourceFiles
                .Where(s => s.WeekId == weekId && s.Status == "Ready")
                .FirstOrDefaultAsync();

            if (sourceFile == null)
                return Results.BadRequest("No source file found for this week");

            var wrongTopics = string.Join("\n", request.WrongTopics.Select(t => $"- {t}"));

            var reExplanation = await aiService.GenerateReExplanationAsync(
                sourceFile.ExtractedText,
                wrongTopics);

            return Results.Ok(new
            {
                WeekId = weekId,
                ReExplanation = reExplanation.Explanation,
                FocusAreas = reExplanation.FocusAreas,
                NewQuestions = reExplanation.NewQuestions,
                Message = "Here's a different explanation focusing on what you missed."
            });
        })
        .WithName("ReExplain")
        .WithOpenApi();
    }
}

public record ReExplainRequest(List<string> WrongTopics);
