namespace ZainaPlatform.Core.Entities;

public class SourceFile
{
    public int Id { get; set; }
    public int WeekId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FileType { get; set; } = string.Empty;
    public string StoragePath { get; set; } = string.Empty;
    public string ExtractedText { get; set; } = string.Empty;
    public string Status { get; set; } = "Uploading";
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    public Week Week { get; set; } = null!;
}
