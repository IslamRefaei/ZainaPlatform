using Microsoft.EntityFrameworkCore;
using ZainaPlatform.Core.Entities;

namespace ZainaPlatform.Infrastructure.Data;

public class ZainaDbContext : DbContext
{
    public ZainaDbContext(DbContextOptions<ZainaDbContext> options) : base(options) { }

    public DbSet<Subject> Subjects => Set<Subject>();
    public DbSet<Week> Weeks => Set<Week>();
    public DbSet<SourceFile> SourceFiles => Set<SourceFile>();
    public DbSet<AiContent> AiContents => Set<AiContent>();
    public DbSet<QuizQuestion> QuizQuestions => Set<QuizQuestion>();
    public DbSet<QuizAttempt> QuizAttempts => Set<QuizAttempt>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Week>()
            .HasOne(w => w.AiContent)
            .WithOne(a => a.Week)
            .HasForeignKey<AiContent>(a => a.WeekId);

        modelBuilder.Entity<Week>()
            .HasOne(w => w.Subject)
            .WithMany(s => s.Weeks)
            .HasForeignKey(w => w.SubjectId);

        modelBuilder.Entity<QuizQuestion>()
            .HasOne(q => q.AiContent)
            .WithMany(a => a.QuizQuestions)
            .HasForeignKey(q => q.AiContentId);

        modelBuilder.Entity<QuizAttempt>()
            .HasOne(q => q.AiContent)
            .WithMany()
            .HasForeignKey(q => q.AiContentId);

        modelBuilder.Entity<AiContent>()
            .Property(a => a.LessonCardEn).HasColumnType("text");
        modelBuilder.Entity<AiContent>()
            .Property(a => a.LessonCardAr).HasColumnType("text");
        modelBuilder.Entity<AiContent>()
            .Property(a => a.Enrichment).HasColumnType("text");
        modelBuilder.Entity<SourceFile>()
            .Property(s => s.ExtractedText).HasColumnType("text");
    }
}
