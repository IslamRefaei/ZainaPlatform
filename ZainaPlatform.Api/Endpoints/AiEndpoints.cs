using Microsoft.EntityFrameworkCore;
using ZainaPlatform.Api.Services;
using ZainaPlatform.Infrastructure.Data;

namespace ZainaPlatform.Api.Endpoints;

public static class AiEndpoints
{
    public static void MapAiEndpoints(this WebApplication app)
    {
        app.MapPost("/api/weeks/{weekId}/generate", async (
            int weekId,
            ZainaDbContext db,
            AiGenerationService aiService) =>
        {
            var week = await db.Weeks
                .Include(w => w.SourceFiles)
                .FirstOrDefaultAsync(w => w.Id == weekId);

            if (week == null)
                return Results.NotFound($"Week {weekId} not found");

            var sourceFile = week.SourceFiles.FirstOrDefault(f => f.Status == "Ready");
            if (sourceFile == null)
                return Results.BadRequest("No processed source file found for this week");

            var existing = await db.AiContents.FirstOrDefaultAsync(a => a.WeekId == weekId);
            if (existing != null)
                return Results.BadRequest("AI content already generated for this week. Delete it first to regenerate.");

            try
            {
                week.Status = "Generating";
                await db.SaveChangesAsync();

                var aiContent = await aiService.GenerateLessonContentAsync(weekId, sourceFile.ExtractedText);

                week.Status = "Ready";
                await db.SaveChangesAsync();

                return Results.Ok(new
                {
                    aiContent.Id,
                    aiContent.WeekId,
                    aiContent.Summary,
                    aiContent.GeneratedAt,
                    Message = "Lesson card and quiz generated successfully"
                });
            }
            catch (Exception ex)
            {
                week.Status = "Failed";
                await db.SaveChangesAsync();
                return Results.Problem($"AI generation failed: {ex.Message}");
            }
        })
        .WithName("GenerateAiContent")
        .WithOpenApi();
    }
}
