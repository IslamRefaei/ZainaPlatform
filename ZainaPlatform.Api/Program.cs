using Microsoft.EntityFrameworkCore;
using ZainaPlatform.Api.Endpoints;
using ZainaPlatform.Api.Services;
using ZainaPlatform.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(o => o.AddPolicy("AllowAll", p =>
    p.AllowAnyOrigin()
     .AllowAnyMethod()
     .AllowAnyHeader()));
builder.Services.AddDbContext<ZainaDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddScoped<FileExtractionService>();
builder.Services.AddScoped<AiGenerationService>();

var app = builder.Build();

app.UseCors("AllowAll");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapGet("/health", () => "ZainaPlatform API is running ✓");
app.MapAcademicEndpoints();
app.MapSubjectEndpoints();
app.MapUploadEndpoints();
app.MapAiEndpoints();
app.MapQuizEndpoints();
app.MapReExplainEndpoints();
app.MapLessonEndpoints();

app.Run();
