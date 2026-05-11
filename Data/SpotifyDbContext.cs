using Microsoft.EntityFrameworkCore;
using Arcturus.Models;

namespace Arcturus.Data
{
    public class SpotifyDbContext : DbContext
    {
        public SpotifyDbContext(DbContextOptions<SpotifyDbContext> options) : base(options) { }

        public DbSet<Music> Music { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.Entity<Music>(entity =>
            {
                entity.ToTable("Music");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Title)          .IsRequired().HasMaxLength(200);
                entity.Property(e => e.Artist)         .IsRequired().HasMaxLength(200).HasDefaultValue("Desconhecido");
                entity.Property(e => e.Album)          .HasMaxLength(200);
                entity.Property(e => e.Genre)          .HasMaxLength(100);
                entity.Property(e => e.MimeType)       .IsRequired().HasMaxLength(100).HasDefaultValue("audio/mpeg");
                entity.Property(e => e.OriginalFileName).IsRequired().HasMaxLength(300);
                // PostgreSQL usa bytea em vez de varbinary(max)
                entity.Property(e => e.AudioData)      .IsRequired();
                entity.Property(e => e.UploadedAt)     .IsRequired().HasDefaultValueSql("NOW()");
                entity.Property(e => e.PlayCount)      .HasDefaultValue(0);
                entity.HasIndex(e => e.Title);
                entity.HasIndex(e => e.Artist);
                entity.HasIndex(e => e.UploadedAt);
            });
        }
    }
}