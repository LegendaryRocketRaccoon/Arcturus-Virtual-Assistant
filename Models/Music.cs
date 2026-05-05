using System.ComponentModel.DataAnnotations;

namespace Arcturus.Models
{
    public class Music
    {
        [Key] public int Id { get; set; }

        [Required][MaxLength(200)] public string Title  { get; set; } = string.Empty;
        [MaxLength(200)]           public string Artist { get; set; } = "Desconhecido";
        [MaxLength(200)]           public string? Album  { get; set; }
        [MaxLength(100)]           public string? Genre  { get; set; }
        public int? Year     { get; set; }
        public int? Duration { get; set; }

        [Required]           public byte[] AudioData        { get; set; } = Array.Empty<byte>();
        [MaxLength(100)]     public string MimeType          { get; set; } = "audio/mpeg";
        public long          FileSize                        { get; set; }
        [MaxLength(300)]     public string OriginalFileName  { get; set; } = string.Empty;
        public DateTime      UploadedAt                     { get; set; } = DateTime.UtcNow;
        public int           PlayCount                      { get; set; } = 0;
        public DateTime?     LastPlayedAt                   { get; set; }
    }
}
