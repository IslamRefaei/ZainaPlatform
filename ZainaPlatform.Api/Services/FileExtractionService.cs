using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Presentation;
using DocumentFormat.OpenXml.Wordprocessing;
using UglyToad.PdfPig;
using System.Text;

namespace ZainaPlatform.Api.Services;

public class FileExtractionService
{
    public string ExtractText(string filePath, string fileType)
    {
        return fileType.ToLower() switch
        {
            ".pdf" => ExtractFromPdf(filePath),
            ".docx" => ExtractFromDocx(filePath),
            ".pptx" => ExtractFromPptx(filePath),
            _ => throw new NotSupportedException($"File type {fileType} is not supported")
        };
    }

    private string ExtractFromPdf(string filePath)
    {
        var sb = new StringBuilder();
        using var pdf = PdfDocument.Open(filePath);
        foreach (var page in pdf.GetPages())
            sb.AppendLine(page.Text);
        return sb.ToString();
    }

    private string ExtractFromDocx(string filePath)
    {
        var sb = new StringBuilder();
        using var doc = WordprocessingDocument.Open(filePath, false);
        var body = doc.MainDocumentPart?.Document?.Body;
        if (body == null) return string.Empty;
        foreach (var para in body.Elements<Paragraph>())
            sb.AppendLine(para.InnerText);
        return sb.ToString();
    }

    private string ExtractFromPptx(string filePath)
    {
        var sb = new StringBuilder();
        using var prs = PresentationDocument.Open(filePath, false);
        var slides = prs.PresentationPart?.SlideParts;
        if (slides == null) return string.Empty;
        foreach (var slide in slides)
        {
            foreach (var shape in slide.Slide.Descendants<DocumentFormat.OpenXml.Drawing.Paragraph>())
                sb.AppendLine(shape.InnerText);
        }
        return sb.ToString();
    }
}
