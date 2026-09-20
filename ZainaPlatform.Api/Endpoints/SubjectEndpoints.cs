using Microsoft.EntityFrameworkCore;
using ZainaPlatform.Core.Entities;
using ZainaPlatform.Infrastructure.Data;

namespace ZainaPlatform.Api.Endpoints;

public static class SubjectEndpoints
{
    public static void MapSubjectEndpoints(this WebApplication app)
    {
        app.MapGet("/api/subjects", async (ZainaDbContext db) =>
            Results.Ok(await db.Subjects.OrderBy(s => s.Name).ToListAsync()));

        app.MapPost("/api/subjects", async (Subject subject, ZainaDbContext db) =>
        {
            db.Subjects.Add(subject);
            await db.SaveChangesAsync();
            return Results.Ok(subject);
        });

        app.MapDelete("/api/subjects/{id}", async (int id, ZainaDbContext db) =>
        {
            var s = await db.Subjects.FindAsync(id);
            if (s == null) return Results.NotFound();
            db.Subjects.Remove(s);
            await db.SaveChangesAsync();
            return Results.Ok();
        });

        app.MapGet("/api/subjects/{subjectId}/weeks", async (int subjectId, ZainaDbContext db) =>
            Results.Ok(await db.Weeks.Where(w => w.SubjectId == subjectId).OrderBy(w => w.WeekNumber).ToListAsync()));

        app.MapPost("/api/subjects/{subjectId}/weeks", async (int subjectId, Week week, ZainaDbContext db) =>
        {
            week.SubjectId = subjectId;
            db.Weeks.Add(week);
            await db.SaveChangesAsync();
            return Results.Ok(week);
        });
    }
}
