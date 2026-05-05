# ── Dockerfile — Arcturus Server ────────────────────────────────────────────
# Usado pelo Render.com para buildar e rodar o servidor .NET

# Etapa 1: Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copia o projeto e restaura dependências
COPY Arcturus.csproj ./
RUN dotnet restore

# Copia todo o resto e publica
COPY . .
RUN dotnet publish -c Release -o /app/publish

# Etapa 2: Runtime (imagem menor, só para rodar)
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

COPY --from=build /app/publish .

# Porta que o Render vai expor
EXPOSE 8080

# Variável de ambiente para o ASP.NET escutar na porta correta
ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "Arcturus.dll"]
