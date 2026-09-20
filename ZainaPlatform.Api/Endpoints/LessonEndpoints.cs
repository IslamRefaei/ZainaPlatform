using Microsoft.EntityFrameworkCore;
using Anthropic.SDK;
using Anthropic.SDK.Messaging;
using ZainaPlatform.Infrastructure.Data;

namespace ZainaPlatform.Api.Endpoints;

public static class LessonEndpoints
{
    public static void MapLessonEndpoints(this WebApplication app)
    {
        app.MapGet("/api/lessons/{weekId}", async (int weekId, ZainaDbContext db) =>
        {
            var content = await db.AiContents.FirstOrDefaultAsync(a => a.WeekId == weekId);
            if (content == null) return Results.NotFound("No lesson content found");
            return Results.Ok(new {
                content.Id, content.WeekId,
                content.LessonCardEn, content.LessonCardAr,
                KeyFacts = content.KeyFacts,
                content.Summary, content.Enrichment, content.GeneratedAt
            });
        });

        app.MapPost("/api/lessons/{weekId}/chat", async (int weekId, ChatRequest request, ZainaDbContext db) =>
        {
            var content = await db.AiContents.FirstOrDefaultAsync(a => a.WeekId == weekId);
            if (content == null) return Results.NotFound();

            var client = new AnthropicClient(Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY")!);
            var prompt = $"""
                You are a friendly tutor helping a primary school student (age 8-12) understand a lesson.
                Be encouraging, simple, and use fun examples.

                Lesson context:
                {request.Context}

                Student's question:
                {request.Message}

                Answer in 2-3 short paragraphs maximum. Use simple words.
                """;

            var response = await client.Messages.GetClaudeMessageAsync(new MessageParameters
            {
                Model = "claude-sonnet-4-6",
                MaxTokens = 500,
                Messages = new List<Message>
                {
                    new Message
                    {
                        Role = RoleType.User,
                        Content = new List<ContentBase> { new TextContent { Text = prompt } }
                    }
                }
            });

            var answer = (response.Content[0] as TextContent)!.Text;
            return Results.Ok(new { Response = answer });
        });
    }
}

public record ChatRequest(string Message, string Context);
