using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using PersonalKnowledgeBase.Api.Models;

namespace PersonalKnowledgeBase.Api.Data;

/// <summary>
/// EF Core DbContext for the application. Inherits Identity tables and adds
/// <see cref="Note"/>, <see cref="Tag"/>, <see cref="Folder"/>, <see cref="NoteTag"/>.
/// </summary>
public class AppDbContext : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Note> Notes => Set<Note>();
    public DbSet<Tag> Tags => Set<Tag>();
    public DbSet<Folder> Folders => Set<Folder>();
    public DbSet<NoteTag> NoteTags => Set<NoteTag>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // NoteTag composite key
        modelBuilder.Entity<NoteTag>(entity =>
        {
            entity.HasKey(nt => new { nt.NoteId, nt.TagId });

            entity.HasOne(nt => nt.Note)
                .WithMany(n => n.NoteTags)
                .HasForeignKey(nt => nt.NoteId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(nt => nt.Tag)
                .WithMany(t => t.NoteTags)
                .HasForeignKey(nt => nt.TagId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Note -> User (cascade) and Folder (set null)
        modelBuilder.Entity<Note>(entity =>
        {
            entity.HasOne(n => n.User)
                .WithMany(u => u.Notes)
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(n => n.Folder)
                .WithMany(f => f.Notes)
                .HasForeignKey(n => n.FolderId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(n => new { n.UserId, n.UpdatedAt });
            entity.HasIndex(n => new { n.UserId, n.IsPinned });
            entity.Property(n => n.ContentJson).HasColumnType("TEXT");
            entity.Property(n => n.ContentText).HasColumnType("TEXT");
        });

        // Tag -> User (cascade), unique (UserId, Name) with case-insensitive collation
        modelBuilder.Entity<Tag>(entity =>
        {
            entity.HasOne(t => t.User)
                .WithMany(u => u.Tags)
                .HasForeignKey(t => t.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.Property(t => t.Name).UseCollation("NOCASE");
            entity.HasIndex(t => new { t.UserId, t.Name }).IsUnique();
        });

        // Folder -> User (cascade), unique (UserId, Name) with case-insensitive collation
        modelBuilder.Entity<Folder>(entity =>
        {
            entity.HasOne(f => f.User)
                .WithMany(u => u.Folders)
                .HasForeignKey(f => f.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.Property(f => f.Name).UseCollation("NOCASE");
            entity.HasIndex(f => new { f.UserId, f.Name }).IsUnique();
        });
    }
}
