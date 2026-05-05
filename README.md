# 🌌 Arcturus — Como configurar

## Estrutura final do projeto

```
Arcturus_Server/
├── Arcturus.csproj
├── Program.cs
├── Controllers/
│   └── MusicController.cs
├── Data/
│   └── SpotifyDbContext.cs
├── Models/
│   └── Music.cs
├── Properties/
│   └── launchSettings.json
└── wwwroot/              ← todos os arquivos do frontend ficam aqui
    ├── index.html        ← página de login
    ├── arcturus.html     ← app principal
    ├── css/
    │   ├── arcturus.css
    │   └── login.css
    ├── img/
    │   └── Arcturus.png
    ├── js/
    │   ├── arcturus.js
    │   ├── player.js
    │   ├── ai.js         ← coloque sua chave aqui
    │   └── auth.js       ← copie do projeto original
    └── musicas/          ← copie sua pasta de músicas aqui
        ├── AC_DC - Thunderstruck.mp3
        └── ...
```

---

## Passo a passo

### 1. Copiar arquivos do frontend para wwwroot/

Copie da pasta do Arcturus original para `Arcturus_Server/wwwroot/`:
- Pasta `css/` → `wwwroot/css/`
- Pasta `img/` → `wwwroot/img/`
- Pasta `musicas/` → `wwwroot/musicas/`
- Arquivo `js/auth.js` → `wwwroot/js/auth.js`

Os arquivos `index.html`, `arcturus.html` e os 3 JS (`ai.js`, `player.js`, `arcturus.js`)
já estão prontos na pasta `wwwroot/` deste projeto.

### 2. Configurar sua chave da API

**Opção 1: Variável de ambiente (recomendado para produção)**
```powershell
setx GROQ_API_KEY "sua_chave_gsk_aqui"
```

**Opção 2: Arquivo de configuração (desenvolvimento)**
Edite `appsettings.json` e substitua:
```json
"GROQ_API_KEY": "YOUR_GROQ_API_KEY_HERE"
```
pela sua chave real.

**Opção 3: launchSettings.json (VSCode desenvolvimento)**
Edite `Properties/launchSettings.json` e substitua:
```json
"GROQ_API_KEY": "YOUR_GROQ_API_KEY_HERE"
```

### 3. Rodar o servidor

```bash
cd Arcturus_Server
dotnet run
```

Abra: **http://localhost:5200**

---

## Botões de Importar e Exportar

### 📥 Importar (substitui `dotnet run import`)
1. Clique em **📥 Importar** na barra de ferramentas
2. Selecione todos os arquivos da pasta `musicas/`
3. Aguarde a barra de progresso — os arquivos são enviados ao banco SQL um por um

### 💾 Exportar (substitui `dotnet run export`)
1. Clique em **💾 Exportar**
2. Clique em **⬇️ Exportar tudo**
3. Cada arquivo é baixado para a sua pasta Downloads

### 🎵 Músicas
Lista todas as músicas do banco SQL. Clique para tocar via stream.

---

## Banco de dados

O Arcturus usa o **mesmo banco SQL do Spotify** (`SpotifyDB`).
Se o Spotify já tiver músicas salvas, elas aparecem automaticamente no Arcturus.

Conexão: `Server=localhost;Database=SpotifyDB;Trusted_Connection=True`
