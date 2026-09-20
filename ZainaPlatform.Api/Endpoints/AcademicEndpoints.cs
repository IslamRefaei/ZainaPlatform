using Microsoft.EntityFrameworkCore;
using ZainaPlatform.Core.Entities;
using ZainaPlatform.Infrastructure.Data;

namespace ZainaPlatform.Api.Endpoints;

public static class AcademicEndpoints
{
    public static void MapAcademicEndpoints(this WebApplication app)
    {
        // Years
        app.MapGet("/api/years", async (ZainaDbContext db) =>
            Results.Ok(await db.AcademicYears.OrderByDescending(y => y.StartYear).ToListAsync()));

        app.MapPost("/api/years", async (AcademicYear year, ZainaDbContext db) =>
        {
            db.AcademicYears.Add(year);
            await db.SaveChangesAsync();
            return Results.Ok(year);
        });

        app.MapDelete("/api/years/{id}", async (int id, ZainaDbContext db) =>
        {
            var y = await db.AcademicYears.FindAsync(id);
            if (y == null) return Results.NotFound();
            db.AcademicYears.Remove(y);
            await db.SaveChangesAsync();
            return Results.Ok();
        });

        // Terms
        app.MapGet("/api/years/{yearId}/terms", async (int yearId, ZainaDbContext db) =>
            Results.Ok(await db.Terms.Where(t => t.AcademicYearId == yearId).OrderBy(t => t.TermNumber).ToListAsync()));

        app.MapPost("/api/years/{yearId}/terms", async (int yearId, Term term, ZainaDbContext db) =>
        {
            term.AcademicYearId = yearId;
            db.Terms.Add(term);
            await db.SaveChangesAsync();
            return Results.Ok(term);
        });

        app.MapDelete("/api/terms/{id}", async (int id, ZainaDbContext db) =>
        {
            var t = await db.Terms.FindAsync(id);
            if (t == null) return Results.NotFound();
            db.Terms.Remove(t);
            await db.SaveChangesAsync();
            return Results.Ok();
        });

        // Subjects under a term
        app.MapGet("/api/terms/{termId}/subjects", async (int termId, ZainaDbContext db) =>
            Results.Ok(await db.Subjects.Where(s => s.TermId == termId).OrderBy(s => s.Name).ToListAsync()));

        app.MapPost("/api/terms/{termId}/subjects", async (int termId, Subject subject, ZainaDbContext db) =>
        {
            subject.TermId = termId;
            db.Subjects.Add(subject);
            await db.SaveChangesAsync();
            return Results.Ok(subject);
        });
    }
}
