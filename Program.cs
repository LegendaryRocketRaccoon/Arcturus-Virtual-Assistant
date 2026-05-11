using System.Net.Http.Headers;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Arcturus.Data;

var builder = WebApplication.CreateBuilder(args);

var port    = Environment.GetEnvironmentVariable("PORT") ?? "8080";
var portNum = int.Parse(port);

builder.WebHost.UseUrls($"http://*:{portNum}");
builder.WebHost.ConfigureKestrel(o =>
{
    o.Limits.MaxRequestBodySize = 524_288_000;
    o.ConfigureHttpsDefaults(_ => { });
});

builder.Services.AddControllers();
builder.Services.AddHttpClient();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var connectionString =
    Environment.GetEnvironmentVariable("DATABASE_URL")
    ?? Environment.GetEnvironmentVariable("SQL_CONNECTION_STRING")
    ?? builder.Configuration.GetConnectionString("Default")
    ?? "Server=localhost;Database=SpotifyDB;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true";

builder.Services.AddDbContext<SpotifyDbContext>(o => o.UseSqlServer(connectionString));

builder.Services.AddCors(o => o.AddPolicy("AllowAll", p =>
    p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()));

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<SpotifyDbContext>();
    try   { db.Database.EnsureCreated(); Console.WriteLine("Banco conectado."); }
    catch (Exception ex) { Console.WriteLine($"Erro no banco: {ex.Message}"); }
}

if (app.Environment.IsDevelopment()) { app.UseSwagger(); app.UseSwaggerUI(); }

app.UseCors("AllowAll");

app.Use(async (context, next) =>
{
    context.Response.Headers["Content-Security-Policy"] =
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' https://www.gstatic.com https://www.googleapis.com https://www.youtube.com https://s.ytimg.com; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "connect-src 'self' https://www.gstatic.com https://www.googleapis.com https://*.firebaseio.com https://*.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com; " +
        "img-src 'self' data: https://www.gstatic.com https://www.googleapis.com https://i.ytimg.com; " +
        "frame-src https://www.youtube.com https://www.youtube-nocookie.com;";
    await next();
});

app.UseDefaultFiles();
app.UseStaticFiles();
app.UseRouting();
app.MapControllers();

app.MapGet("/api/debug/groq", (IConfiguration config) =>
{
    var fromEnv      = Environment.GetEnvironmentVariable("GROQ_API_KEY");
    var fromSettings = config["GroqApiKey"];
    var key          = fromEnv ?? fromSettings;
    return Results.Ok(new
    {
        fonte   = fromEnv != null ? "variavel de ambiente" : fromSettings != null ? "appsettings.json" : "NENHUMA",
        prefixo = key != null ? key[..Math.Min(12, key.Length)] + "..." : "null",
        tamanho = key?.Length ?? 0,
        status  = key != null ? "chave encontrada" : "CHAVE NAO ENCONTRADA"
    });
});

app.MapPost("/api/ai/chat", async (HttpContext http, IHttpClientFactory cf, IConfiguration config) =>
{
    var apiKey = Environment.GetEnvironmentVariable("GROQ_API_KEY")
              ?? config["GroqApiKey"];

    if (string.IsNullOrWhiteSpace(apiKey))
        return Results.Problem("GROQ_API_KEY nao configurada.", statusCode: 500);

    var body = await new StreamReader(http.Request.Body).ReadToEndAsync();
    var req  = new HttpRequestMessage(HttpMethod.Post, "https://api.groq.com/openai/v1/chat/completions")
    {
        Content = new StringContent(body, Encoding.UTF8, "application/json")
    };
    req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

    var client  = cf.CreateClient();
    client.Timeout = TimeSpan.FromSeconds(60);
    var res     = await client.SendAsync(req);
    var content = await res.Content.ReadAsStringAsync();

    Console.WriteLine($"[Groq] Status: {(int)res.StatusCode}");

    return Results.Text(content, "application/json", Encoding.UTF8, (int)res.StatusCode);
});

app.MapGet("/", () => Results.Redirect("/index.html"));

Console.WriteLine($"Arcturus rodando em http://0.0.0.0:{portNum}");
app.Run();