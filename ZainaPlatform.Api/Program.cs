using Microsoft.EntityFrameworkCore;
using ZainaPlatform.Api.Endpoints;
using ZainaPlatform.Api.Services;
using ZainaPlatform.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddDbContext<ZainaDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddScoped<FileExtractionService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapGet("/health", () => "ZainaPlatform API is running ✓");
app.MapUploadEndpoints();

app.Run();
