using Microsoft.EntityFrameworkCore;
using ZainaPlatform.Api.Services;
using ZainaPlatform.Core.Entities;
using ZainaPlatform.Infrastructure.Data;

namespace ZainaPlatform.Api.Endpoints;

public static class UploadEndpoints
{
    public static void MapUploadEndpoints(this WebApplication app)
    {
        app.MapPost("/api/weeks/{weekId}/upload", async (
            int weekId,
            IFormFile file,
            ZainaDbContext db,
            FileExtractionService extractor) =>
        {
            var week = await db.Weeks.FindAsync(weekId);
            if (week == null)
                return Results.NotFound($"Week {weekId} not found");

            var allowed = new[] { ".pdf", ".docx", ".pptx" };
            var ext = Path.GetExtension(file.FileName).ToLower();
            if (!allowed.Contains(ext))
                return Results.BadRequest("Only PDF, DOCX and PPTX files are supported");

            if (file.Length > 50 * 1024 * 1024)
                return Results.BadRequest("File size exceeds 50MB limit");

            // Save file to disk
            var uploadPath = Path.Combine("/workspaces/ZainaPlatform/uploads", $"{Guid.NewGuid()}{ext}");
            await using (var stream = File.Create(uploadPath))
                await file.CopyToAsync(stream);

            // Extract text
            string extractedText;
            try
            {
                extractedText = extractor.ExtractText(uploadPath, ext);
            }
            catch (Exception ex)
            {
                return Results.Problem($"Text extraction failed: {ex.Message}");
            }

            // Save to DB
            var sourceFile = new SourceFile
            {
                WeekId = weekId,
                FileName = file.FileName,
                FileType = ext,
                StoragePath = uploadPath,
                ExtractedText = extractedText,
                Status = "Ready"
            };

            db.SourceFiles.Add(sourceFile);
            week.Status = "Processing";
            await db.SaveChangesAsync();

            return Results.Ok(new
            {
                sourceFile.Id,
                sourceFile.FileName,
                sourceFile.Status,
                ExtractedLength = extractedText.Length,
                Message = "File uploaded and text extracted successfully"
            });
        })
        .DisableAntiforgery()
        .WithName("UploadFile")
        .WithOpenApi();
    }
}
