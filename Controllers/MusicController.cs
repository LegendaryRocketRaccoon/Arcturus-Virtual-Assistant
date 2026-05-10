using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Arcturus.Data;
using Arcturus.Models;

namespace Arcturus.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MusicController : ControllerBase
{
    private readonly SpotifyDbContext _db;
    private readonly ILogger<MusicController> _logger;

    public MusicController(SpotifyDbContext db, ILogger<MusicController> logger)
    {
        _db = db; _logger = logger;
    }

    [HttpPost("upload")]
    [RequestSizeLimit(104_857_600)]
    public async Task<IActionResult> Upload([FromForm] MusicUploadRequest req)
    {
        if (req.File == null || req.File.Length == 0)
            return BadRequest(new { error = "Arquivo não fornecido" });

        var allowed = new[] { ".mp3", ".mp4", ".m4a", ".webm", ".wav", ".ogg" };
        var ext     = Path.GetExtension(req.File.FileName).ToLowerInvariant();
        if (!allowed.Contains(ext))
            return BadRequest(new { error = $"Formato não suportado. Use: {string.Join(", ", allowed)}" });

        byte[] bytes;
        using (var ms = new MemoryStream()) { await req.File.CopyToAsync(ms); bytes = ms.ToArray(); }

        var music = new Music
        {
            Title            = req.Title,
            Artist           = req.Artist ?? "Desconhecido",
            Album            = req.Album,
            Genre            = req.Genre,
            Year             = req.Year,
            Duration         = req.Duration,
            AudioData        = bytes,
            MimeType         = req.File.ContentType,
            FileSize         = req.File.Length,
            OriginalFileName = req.File.FileName,
            UploadedAt       = DateTime.UtcNow,
        };

        _db.Music.Add(music);
        await _db.SaveChangesAsync();
        _logger.LogInformation("Upload: '{Title}' (ID {Id})", music.Title, music.Id);

        return Ok(new { success = true, music = new {
            id = music.Id, title = music.Title, artist = music.Artist,
            fileSize = music.FileSize, streamUrl = $"/api/music/stream/{music.Id}"
        }});
    }

    [HttpGet("list")]
    public async Task<IActionResult> List(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? search = null)
    {
        var q = _db.Music.AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
            q = q.Where(m => m.Title.Contains(search) || m.Artist.Contains(search));

        var total = await q.CountAsync();
        var music = await q
            .OrderByDescending(m => m.UploadedAt)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(m => new {
                id = m.Id, title = m.Title, artist = m.Artist, album = m.Album,
                genre = m.Genre, year = m.Year, duration = m.Duration,
                fileSize = m.FileSize, originalFileName = m.OriginalFileName,
                uploadedAt = m.UploadedAt, streamUrl = $"/api/music/stream/{m.Id}"
            }).ToListAsync();

        return Ok(new { music, pagination = new {
            page, pageSize, total, totalPages = (int)Math.Ceiling(total / (double)pageSize)
        }});
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        var m = await _db.Music.FindAsync(id);
        if (m == null) return NotFound(new { error = "Não encontrada" });
        return Ok(new { id = m.Id, title = m.Title, artist = m.Artist,
            fileSize = m.FileSize, streamUrl = $"/api/music/stream/{m.Id}" });
    }

    [HttpGet("stream/{id}")]
    public async Task<IActionResult> Stream(int id)
    {
        var m = await _db.Music.FindAsync(id);
        if (m == null || m.AudioData == null || m.AudioData.Length == 0)
            return NotFound(new { error = "Áudio não encontrado" });
        return File(m.AudioData, m.MimeType ?? "audio/mpeg", enableRangeProcessing: true);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var m = await _db.Music.FindAsync(id);
        if (m == null) return NotFound(new { error = "Não encontrada" });
        _db.Music.Remove(m); await _db.SaveChangesAsync();
        return Ok(new { success = true });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] MusicUpdateRequest req)
    {
        var m = await _db.Music.FindAsync(id);
        if (m == null) return NotFound(new { error = "Não encontrada" });
        if (!string.IsNullOrWhiteSpace(req.Title)) m.Title = req.Title.Trim();
        if (!string.IsNullOrWhiteSpace(req.Artist)) m.Artist = req.Artist.Trim();
        m.Album = req.Album;
        m.Genre = req.Genre;
        m.Year = req.Year;
        await _db.SaveChangesAsync();
        return Ok(new { success = true, music = new {
            id = m.Id, title = m.Title, artist = m.Artist,
            album = m.Album, genre = m.Genre, year = m.Year
        }});
    }

    [HttpGet("stats")]
    public async Task<IActionResult> Stats()
    {
        var total    = await _db.Music.CountAsync();
        var size     = await _db.Music.SumAsync(m => m.FileSize);
        var duration = await _db.Music.SumAsync(m => m.Duration ?? 0);
        return Ok(new {
            totalMusic            = total,
            totalSizeBytes        = size,
            totalSizeMB           = Math.Round(size / 1_048_576.0, 2),
            totalDurationSeconds  = duration,
        });
    }
}

public class MusicUpdateRequest
{
    public string? Title   { get; set; }
    public string? Artist  { get; set; }
    public string? Album   { get; set; }
    public string? Genre   { get; set; }
    public int?   Year     { get; set; }
}

public class MusicUploadRequest
{
    public IFormFile File    { get; set; } = null!;
    public string Title      { get; set; } = null!;
    public string? Artist    { get; set; }
    public string? Album     { get; set; }
    public string? Genre     { get; set; }
    public int?   Year       { get; set; }
    public int?   Duration   { get; set; }
}
