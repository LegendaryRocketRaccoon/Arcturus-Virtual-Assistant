using Microsoft.EntityFrameworkCore;
using Arcturus.Data;

var builder = WebApplication.CreateBuilder(args);

var port = Environment.GetEnvironmentVariable("PORT") ?? "5200";
builder.WebHost.UseUrls($"http://+:{port}");

builder.WebHost.ConfigureKestrel(o => o.Limits.MaxRequestBodySize = 524_288_000); // 500 MB

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();


var connectionString =
    Environment.GetEnvironmentVariable("DATABASE_URL")
    ?? "Server=localhost;Database=SpotifyDB;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true";

builder.Services.AddDbContext<SpotifyDbContext>(o => o.UseSqlServer(connectionString));

builder.Services.AddCors(o => o.AddPolicy("AllowAll", p =>
    p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()));

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<SpotifyDbContext>();
    try
    {
        db.Database.EnsureCreated();
        Console.WriteLine("Banco de dados conectado!");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Erro no banco: {ex.Message}");
    }
}

if (app.Environment.IsDevelopment()) { app.UseSwagger(); app.UseSwaggerUI(); }

app.UseCors("AllowAll");
app.UseDefaultFiles();
app.UseStaticFiles();
app.UseRouting();
app.MapControllers();
app.MapGet("/", () => Results.Redirect("/index.html"));

Console.WriteLine("╔═══════════════════════════════════════════╗");
Console.WriteLine("║   🌌 Arcturus — Servidor iniciado.        ║");
Console.WriteLine("╚═══════════════════════════════════════════╝");
Console.WriteLine($"Rodando na porta: {port}");
Console.WriteLine($"API:     /api/music");
Console.WriteLine($"Swagger: /swagger");

app.Run();
