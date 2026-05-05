using System.Net.Http.Headers;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Arcturus.Data;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.UseUrls("http://localhost:5200");
builder.WebHost.ConfigureKestrel(o => o.Limits.MaxRequestBodySize = 524_288_000); // 500 MB

builder.Services.AddControllers();
builder.Services.AddHttpClient();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<SpotifyDbContext>(o =>
    o.UseSqlServer("Server=localhost;Database=SpotifyDB;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true"));

builder.Services.AddCors(o => o.AddPolicy("AllowAll", p =>
    p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()));

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<SpotifyDbContext>();
    try   { db.Database.EnsureCreated(); Console.WriteLine("✅ Banco SpotifyDB conectado!"); }
    catch (Exception ex) { Console.WriteLine($"❌ Erro no banco: {ex.Message}"); }
}

if (app.Environment.IsDevelopment()) { app.UseSwagger(); app.UseSwaggerUI(); }

app.UseCors("AllowAll");

app.UseDefaultFiles();
app.UseStaticFiles();

app.UseRouting();
app.MapControllers();

app.MapPost("/api/ai/chat", async (HttpContext http, IHttpClientFactory clientFactory, IConfiguration config) =>
{
    var apiKey = config["GROQ_API_KEY"] ?? Environment.GetEnvironmentVariable("GROQ_API_KEY");
    if (string.IsNullOrWhiteSpace(apiKey))
    {
        return Results.Problem("AI API key is not configured on the server.", statusCode: 500);
    }

    var payload = await new StreamReader(http.Request.Body).ReadToEndAsync();
    var request = new HttpRequestMessage(HttpMethod.Post, "https://api.groq.com/openai/v1/chat/completions")
    {
        Content = new StringContent(payload, Encoding.UTF8, "application/json")
    };
    request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

    var response = await clientFactory.CreateClient().SendAsync(request);
    var content = await response.Content.ReadAsStringAsync();

    return Results.Text(content, "application/json", Encoding.UTF8, (int)response.StatusCode);
});

app.MapGet("/", () => Results.Redirect("/index.html"));

Console.WriteLine("╔═══════════════════════════════════════════╗");
Console.WriteLine("║   Arcturus — Servidor iniciado.           ║");
Console.WriteLine("╚═══════════════════════════════════════════╝");
Console.WriteLine("Arcturus:  http://localhost:5200");
Console.WriteLine("Música:    http://localhost:5200/api/music");
Console.WriteLine("Swagger:   http://localhost:5200/swagger");
Console.WriteLine("════════════════════════════════════════════");

app.Run();
