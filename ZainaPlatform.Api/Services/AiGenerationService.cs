using Anthropic.SDK;
using Anthropic.SDK.Messaging;
using System.Text.Json;
using ZainaPlatform.Core.Entities;
using ZainaPlatform.Infrastructure.Data;

namespace ZainaPlatform.Api.Services;

public class AiGenerationService
{
    private readonly AnthropicClient _client;
    private readonly ZainaDbContext _db;
    private readonly ILogger<AiGenerationService> _logger;

    public AiGenerationService(ZainaDbContext db, ILogger<AiGenerationService> logger)
    {
        _client = new AnthropicClient(Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY")!);
        _db = db;
        _logger = logger;
    }

    private static string GetStringOrRaw(JsonElement element, string key)
    {
        if (!element.TryGetProperty(key, out var prop)) return "";
        return prop.ValueKind == JsonValueKind.String
            ? prop.GetString() ?? ""
            : prop.GetRawText();
    }

    public async Task<AiContent> GenerateLessonContentAsync(int weekId, string extractedText)
    {
        var lessonPrompt = $"""
            You are an educational content creator for primary school students (ages 8-12).
            Given the following lesson material, produce a JSON response with these exact keys:
            - explanationEn: a simplified explanation in clear English (3-4 paragraphs) as a single string
            - explanationAr: the same explanation translated to Modern Standard Arabic as a single string
            - keyFacts: an array of exactly 5 key facts as strings
            - summary: a 2-sentence summary in English as a single string
            - enrichment: a single string containing 2 real-world examples and 1 fun fact

            Respond ONLY with valid JSON, no markdown, no extra text.
            All values must be strings or arrays of strings — no nested objects.

            Lesson material:
            {extractedText}
            """;

        var lessonResponse = await _client.Messages.GetClaudeMessageAsync(new MessageParameters
        {
            Model = "claude-sonnet-4-6",
            MaxTokens = 2000,
            Messages = new List<Message>
            {
                new Message
                {
                    Role = RoleType.User,
                    Content = new List<ContentBase> { new TextContent { Text = lessonPrompt } }
                }
            }
        });

        var lessonRaw = (lessonResponse.Content[0] as TextContent)!.Text;
        _logger.LogInformation("Lesson raw response: {Response}", lessonRaw);

        var lessonJson = lessonRaw
            .Replace("```json", "")
            .Replace("```", "")
            .Trim();

        var lessonData = JsonDocument.Parse(lessonJson).RootElement;

        var quizPrompt = $"""
            You are a quiz generator for primary school students (ages 8-12).
            Given the following lesson content, generate exactly 10 quiz questions.
            Mix: 7 MCQ (4 options each) and 3 True/False.
            Distribution: 4 easy, 4 medium, 2 challenge.

            Return a JSON array where each item has these exact keys:
            - questionText: the question
            - questionType: "mcq" or "truefalse"
            - options: array of answer strings (4 for mcq, ["True","False"] for truefalse)
            - correctAnswer: the correct answer string
            - explanation: why this answer is correct (1-2 sentences)
            - difficulty: "easy", "medium", or "challenge"

            Respond ONLY with a valid JSON array, no markdown, no extra text.

            Lesson content:
            {extractedText}
            """;

        var quizResponse = await _client.Messages.GetClaudeMessageAsync(new MessageParameters
        {
            Model = "claude-sonnet-4-6",
            MaxTokens = 3000,
            Messages = new List<Message>
            {
                new Message
                {
                    Role = RoleType.User,
                    Content = new List<ContentBase> { new TextContent { Text = quizPrompt } }
                }
            }
        });

        var quizRaw = (quizResponse.Content[0] as TextContent)!.Text;
        var quizJson = quizRaw.Replace("```json", "").Replace("```", "").Trim();
        var questions = JsonDocument.Parse(quizJson).RootElement;

        var aiContent = new AiContent
        {
            WeekId = weekId,
            LessonCardEn = GetStringOrRaw(lessonData, "explanationEn"),
            LessonCardAr = GetStringOrRaw(lessonData, "explanationAr"),
            KeyFacts = lessonData.TryGetProperty("keyFacts", out var kf) ? kf.GetRawText() : "[]",
            Summary = GetStringOrRaw(lessonData, "summary"),
            Enrichment = GetStringOrRaw(lessonData, "enrichment"),
            GeneratedAt = DateTime.UtcNow
        };

        _db.AiContents.Add(aiContent);
        await _db.SaveChangesAsync();

        foreach (var q in questions.EnumerateArray())
        {
            _db.QuizQuestions.Add(new QuizQuestion
            {
                AiContentId = aiContent.Id,
                QuestionText = q.GetProperty("questionText").GetString() ?? "",
                QuestionType = q.GetProperty("questionType").GetString() ?? "mcq",
                Options = q.GetProperty("options").GetRawText(),
                CorrectAnswer = q.GetProperty("correctAnswer").GetString() ?? "",
                Explanation = q.GetProperty("explanation").GetString() ?? "",
                Difficulty = q.GetProperty("difficulty").GetString() ?? "medium",
                Language = "EN"
            });
        }

        await _db.SaveChangesAsync();
        return aiContent;
    }

    public async Task<ReExplanationResult> GenerateReExplanationAsync(
    string extractedText, string wrongTopics)
    {
        var prompt = $"""
        You are an educational tutor for primary school students (ages 8-12).
        A student just took a quiz and got these questions wrong:
        {wrongTopics}

        Using the lesson material below, explain ONLY these specific concepts again
        but using a completely different approach:
        - Use simple real-life analogies and stories instead of definitions
        - Use examples the student can relate to (food, games, sports, animals)
        - Keep it short, friendly and encouraging
        - Then generate 5 new questions targeting ONLY the wrong topics

        Respond with valid JSON with these keys:
        - explanation: a friendly re-explanation string focused on wrong topics
        - focusAreas: array of strings listing the concepts re-explained
        - newQuestions: array of 5 question objects with keys: questionText, questionType, options, correctAnswer, explanation, difficulty

        Lesson material:
        {extractedText}
        """;

        var response = await _client.Messages.GetClaudeMessageAsync(new MessageParameters
        {
            Model = "claude-sonnet-4-6",
            MaxTokens = 2000,
            Messages = new List<Message>
        {
            new Message
            {
                Role = RoleType.User,
                Content = new List<ContentBase> { new TextContent { Text = prompt } }
            }
        }
        });

        var raw = (response.Content[0] as TextContent)!.Text;
        var json = raw.Replace("```json", "").Replace("```", "").Trim();
        var data = System.Text.Json.JsonDocument.Parse(json).RootElement;

        var explanation = data.GetProperty("explanation").GetString() ?? "";
        var focusAreas = data.GetProperty("focusAreas")
            .EnumerateArray()
            .Select(f => f.GetString() ?? "")
            .ToList();

        var newQuestions = data.GetProperty("newQuestions")
            .EnumerateArray()
            .Select(q => (object)new
            {
                QuestionText = q.GetProperty("questionText").GetString(),
                QuestionType = q.GetProperty("questionType").GetString(),
                Options = q.GetProperty("options").GetRawText(),
                CorrectAnswer = q.GetProperty("correctAnswer").GetString(),
                Explanation = q.GetProperty("explanation").GetString(),
                Difficulty = q.GetProperty("difficulty").GetString()
            }).ToList();

        return new ReExplanationResult(explanation, focusAreas, newQuestions);
    }
}

public record ReExplanationResult(
    string Explanation,
    List<string> FocusAreas,
    List<object> NewQuestions);
