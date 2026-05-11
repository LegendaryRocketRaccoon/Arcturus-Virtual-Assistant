import { player, extractYouTubeId, apiListMusic, apiStats, apiUpload, apiDelete, apiUpdateMusic, API_BASE } from "./player.js";
import { askAI, clearHistory } from "./ai.js";

import { initializeApp }                        from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const ADMIN_EMAIL = "chimellogustavocamara@gmail.com";
let isAdmin = false;

function applyPermissions() {
    const restricted = document.querySelectorAll(".admin-only");
    restricted.forEach(el => {
        el.style.display = isAdmin ? "" : "none";
    });
}

const PEOPLE = [
    {
        name:      "Gustavo Chimello",
        role:      "Developer & Creator of Arcturus",
        avatar:    "img/gustavo.jpeg",
        initials:  "GC",
        creator:   true,
        linkedin:  "https://www.linkedin.com/in/dev-chimello/",
        github:    "https://github.com/LegendaryRocketRaccoon",
        portfolio: "https://legendaryrocketraccoon.github.io/Portfolio/",
    },
    {
        name:      "Olavo Xavier",
        avatar:    "img/olavo.png",
        initials:  "OX",
        creator:   false,
        linkedin:  "https://www.linkedin.com/in/olavo-xavier-1746673b5/",
        github:    "https://github.com/TheAppleJuicer",
        portfolio: "https://portfolio-olavo.netlify.app/",
    },
];

const FB = {
    apiKey:            "AIzaSyB8Ji1solW904fstUbIUcHCD8RnRn8CTsI",
    authDomain:        "deimos---ia.firebaseapp.com",
    projectId:         "deimos---ia",
    storageBucket:     "deimos---ia.firebasestorage.app",
    messagingSenderId: "418940529875",
    appId:             "1:418940529875:web:feebf6b23874ab81d8b826",
};

const auth = getAuth(initializeApp(FB));

onAuthStateChanged(auth, user => {
    if (!user) { window.location.href = "index.html"; return; }
    const email   = user.email || "";
    isAdmin       = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
    const emailEl = document.getElementById("user-email");
    const av      = document.getElementById("user-avatar");
    if (emailEl) emailEl.textContent = email;
    if (av)      av.textContent      = email.substring(0, 2).toUpperCase();
    applyPermissions();
});

document.getElementById("logout-btn").addEventListener("click", () =>
    signOut(auth).then(() => window.location.href = "index.html")
);

const chatWrap   = document.getElementById("chat-wrap");
const inputEl    = document.getElementById("user-input");
const sendBtn    = document.getElementById("send-btn");
const voiceBtn   = document.getElementById("voice-btn");
const statusText = document.getElementById("status-text");

let voiceOn = true;
const synth = window.speechSynthesis;

function speak(text) {
    if (!voiceOn || !synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text.substring(0, 300));
    u.lang  = "pt-BR"; u.pitch = 1; u.rate = 1; u.volume = 1;
    u.voice = synth.getVoices().find(v => v.lang.startsWith("pt")) || null;
    synth.speak(u);
}

voiceBtn.addEventListener("click", () => {
    voiceOn = !voiceOn;
    voiceBtn.classList.toggle("muted", !voiceOn);
    voiceBtn.textContent = voiceOn ? "🔊" : "🔇";
    setStatus(voiceOn ? "Voz ativada." : "Voz desativada.");
});

function setStatus(msg) { if (statusText) statusText.textContent = msg; }

function addMsg(html, role) {
    const wrap     = document.createElement("div");
    wrap.className = `msg ${role}`;

    if (role === "bot") {
        const av     = document.createElement("img");
        av.className = "msg-avatar bot-av";
        av.alt       = "Arcturus";
        av.src       = "img/Arcturus.png";
        av.onerror   = () => { av.style.display = "none"; };
        wrap.appendChild(av);
    } else {
        const av       = document.createElement("div");
        av.className   = "msg-avatar user-av";
        const email    = document.getElementById("user-email")?.textContent || "U";
        av.textContent = email.substring(0, 2).toUpperCase();
        wrap.appendChild(av);
    }

    const bubble     = document.createElement("div");
    bubble.className = "msg-bubble";

    if (role === "bot") {
        const nm       = document.createElement("div");
        nm.className   = "msg-name";
        nm.textContent = "Arcturus";
        bubble.appendChild(nm);
    }

    const body     = document.createElement("div");
    body.innerHTML = html;
    bubble.appendChild(body);
    wrap.appendChild(bubble);
    chatWrap.appendChild(wrap);
    chatWrap.scrollTop = chatWrap.scrollHeight;
    return bubble;
}

function showTyping() {
    const wrap       = document.createElement("div");
    wrap.className   = "msg bot";
    wrap.id          = "typing-indicator";
    const av         = document.createElement("img");
    av.className     = "msg-avatar bot-av";
    av.src           = "img/Arcturus.png";
    av.alt           = "Arcturus";
    av.onerror       = () => { av.style.display = "none"; };
    const bubble     = document.createElement("div");
    bubble.className = "msg-bubble";
    bubble.innerHTML = `<div class="msg-name">Arcturus</div>
        <div class="typing-dots"><span></span><span></span><span></span></div>`;
    wrap.appendChild(av);
    wrap.appendChild(bubble);
    chatWrap.appendChild(wrap);
    chatWrap.scrollTop = chatWrap.scrollHeight;
    return wrap;
}

async function sendMessage() {
    const text = inputEl.value.trim();
    if (!text) return;

    addMsg(esc(text), "user");
    inputEl.value    = "";
    sendBtn.disabled = true;
    setStatus("Arcturus esta pensando...");

    if (/(?:youtube\.com|youtu\.be)/.test(text)) {
        const id = extractYouTubeId(text);
        if (id && player.playYouTube(text, "YouTube")) {
            addMsg(`<p>Reproduzindo o video do YouTube.</p>`, "bot");
            setStatus("Reproduzindo YouTube.");
            sendBtn.disabled = false;
            return;
        }
    }

    const typing = showTyping();
    try {
        const reply = await askAI(text);
        typing.remove();

        const ytMatch = reply.match(/https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\/\S+/);
        if (ytMatch) player.playYouTube(ytMatch[0], "YouTube");

        const fmt = reply
            .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
            .replace(/\*(.+?)\*/g,     "<em>$1</em>")
            .replace(/`(.+?)`/g,       "<code>$1</code>")
            .replace(/\n\n/g,          "</p><p>")
            .replace(/\n/g,            "<br>");

        addMsg(`<p>${fmt}</p>`, "bot");
        speak(reply.replace(/<[^>]+>/g, ""));
        setStatus("Pronto.");
    } catch (err) {
        typing.remove();
        addMsg(`<p>${esc(err.message || "Erro de conexao. Tente novamente.")}</p>`, "bot");
        setStatus("Erro.");
    }

    sendBtn.disabled = false;
    inputEl.focus();
}

sendBtn.addEventListener("click", sendMessage);
inputEl.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});

document.getElementById("btn-games").addEventListener("click", () => {
    addMsg(`
        <p>Escolha um jogo:</p>
        <div class="menu-links">
          <a class="menu-link" href="https://theapplejuicer.github.io/Mate-O-Dragao/" target="_blank">Slay the Dragon</a>
          <a class="menu-link" href="https://legendaryrocketraccoon.github.io/Pac-Man-Test/" target="_blank">Pac-Man Test</a>
        </div>`, "bot");
});

document.getElementById("btn-music").addEventListener("click", async () => {
    const bubble = addMsg(`<p>Carregando biblioteca...</p>`, "bot");
    try {
        const [data, stats] = await Promise.all([apiListMusic(), apiStats()]);
        const tracks        = data.music || [];
        window._arcTracks   = tracks;

        if (!tracks.length) {
            bubble.querySelector("div").innerHTML =
                `<p>Biblioteca vazia${isAdmin ? ". Use <strong>Importar</strong> para adicionar faixas." : "."}</p>`;
            return;
        }

        const list = tracks.map(t => `
          <div style="display:flex;align-items:center;gap:0.45rem;margin-bottom:0.28rem;">
            <button class="music-btn play-track" style="flex:1;"
              data-id="${t.id}" data-title="${ea(t.title)}" data-artist="${ea(t.artist)}">
              <span class="track-icon">&#9834;</span>
              <span class="track-info">
                <span class="track-title">${esc(t.title)}</span>
                <span class="track-artist">${esc(t.artist)}</span>
              </span>
            </button>
            ${isAdmin ? `
            <button class="edit-btn" data-id="${t.id}" data-title="${ea(t.title)}" data-artist="${ea(t.artist)}" title="Editar">&#9998;</button>
            <button class="del-btn"  data-id="${t.id}" data-title="${ea(t.title)}" title="Deletar">&#128465;</button>
            ` : ""}
          </div>`).join("");

        bubble.innerHTML = `
          <div class="msg-name">Arcturus</div>
          <div style="font-size:0.7rem;color:var(--text-muted);margin-bottom:0.6rem;">
            ${stats.totalMusic} faixas &middot; ${stats.totalSizeMB} MB no banco
          </div>
          <p style="margin-bottom:0.5rem;">Clique em uma faixa para reproduzir.</p>
          ${list}
          <div style="margin-top:0.9rem;padding-top:0.7rem;border-top:1px solid var(--glass-border);">
            <p style="font-size:0.78rem;color:var(--blue-light);margin-bottom:0.35rem;">Reproduzir video do YouTube:</p>
            <div style="display:flex;gap:0.45rem;">
              <input id="yt-url-input" type="text" placeholder="https://youtube.com/watch?v=..."
                style="flex:1;padding:0.42rem 0.7rem;background:rgba(10,22,40,0.9);
                border:1px solid var(--glass-border);border-radius:8px;color:var(--text);
                font-size:0.8rem;outline:none;font-family:'Raleway',sans-serif;"/>
              <button id="yt-url-btn" style="padding:0.42rem 0.85rem;
                background:linear-gradient(135deg,var(--blue-bright),var(--blue-glow));
                border:none;border-radius:8px;color:#fff;
                font-family:'Raleway',sans-serif;font-size:0.78rem;font-weight:700;cursor:pointer;">Play</button>
            </div>
          </div>`;

        bubble.querySelectorAll(".play-track").forEach(btn => {
            btn.addEventListener("click", () => {
                player.playFromSQL(+btn.dataset.id, btn.dataset.title, btn.dataset.artist);
                setStatus(`Reproduzindo: ${btn.dataset.title}`);
            });
        });

        if (isAdmin) {
            bubble.querySelectorAll(".edit-btn").forEach(btn => {
                btn.addEventListener("click", async () => {
                    const newTitle  = prompt("Titulo da faixa:", btn.dataset.title);
                    if (newTitle === null) return;
                    const newArtist = prompt("Artista:", btn.dataset.artist);
                    if (newArtist === null) return;
                    try {
                        await apiUpdateMusic(+btn.dataset.id, {
                            title:  newTitle.trim()  || btn.dataset.title,
                            artist: newArtist.trim() || btn.dataset.artist,
                        });
                        const row = btn.closest("div");
                        row.querySelector(".track-title").textContent  = newTitle;
                        row.querySelector(".track-artist").textContent = newArtist;
                        btn.dataset.title  = newTitle;
                        btn.dataset.artist = newArtist;
                        setStatus("Metadados atualizados.");
                    } catch (e) { alert("Erro: " + e.message); }
                });
            });

            bubble.querySelectorAll(".del-btn").forEach(btn => {
                btn.addEventListener("click", async () => {
                    if (!confirm(`Deletar "${btn.dataset.title}" do banco?`)) return;
                    try {
                        await apiDelete(+btn.dataset.id);
                        btn.closest("div").remove();
                        window._arcTracks = (window._arcTracks || []).filter(t => t.id !== +btn.dataset.id);
                        setStatus("Faixa deletada.");
                    } catch (e) { alert("Erro: " + e.message); }
                });
            });
        }

        setTimeout(() => {
            const ytInput = document.getElementById("yt-url-input");
            const ytBtn   = document.getElementById("yt-url-btn");
            if (!ytBtn || !ytInput) return;
            const playYT = () => {
                const url = ytInput.value.trim();
                if (!url) return;
                const ok = player.playYouTube(url, "YouTube");
                if (ok) { setStatus("Reproduzindo YouTube."); ytInput.value = ""; }
                else    setStatus("URL do YouTube invalida.");
            };
            ytBtn.addEventListener("click", playYT);
            ytInput.addEventListener("keydown", e => { if (e.key === "Enter") playYT(); });
        }, 80);

    } catch (err) {
        bubble.innerHTML = `<div class="msg-name">Arcturus</div>
          <p>Nao foi possivel conectar ao servidor.<br>
          <small style="color:var(--text-muted)">Verifique se o servidor esta rodando.</small></p>`;
    }
});

document.getElementById("btn-import").addEventListener("click", () => {
    if (!isAdmin) {
        addMsg(`<p>Apenas o administrador pode importar faixas.</p>`, "bot");
        return;
    }

    addMsg(`
        <div>
          <p style="margin-bottom:0.45rem;"><strong>Importar faixas para o banco</strong></p>
          <p style="font-size:0.8rem;color:var(--text-dim);margin-bottom:0.7rem;">
            Selecione arquivos de audio. Eles serao salvos e ficaram disponiveis para todos os usuarios.
          </p>
          <label style="display:inline-flex;align-items:center;gap:0.5rem;cursor:pointer;
            padding:0.55rem 1rem;background:rgba(58,123,213,0.11);
            border:1px dashed rgba(58,123,213,0.38);border-radius:8px;
            color:var(--blue-light);font-size:0.82rem;font-weight:600;">
            Selecionar arquivos de audio
            <input type="file" id="import-files" accept=".mp3,.mp4,.m4a,.wav,.ogg,.webm" multiple style="display:none"/>
          </label>
        </div>`, "bot");

    setTimeout(() => {
        const inp = document.getElementById("import-files");
        if (!inp) return;

        inp.addEventListener("change", async e => {
            const files = Array.from(e.target.files)
                .filter(f => /\.(mp3|mp4|m4a|wav|ogg|webm)$/i.test(f.name));
            if (!files.length) return;

            const items = files.map((f, i) => {
                const meta = guessMetadata(f.name);
                return `
                  <div class="import-item" data-index="${i}"
                    style="margin-bottom:0.7rem;padding:0.75rem;border:1px solid rgba(255,255,255,0.07);border-radius:9px;background:rgba(255,255,255,0.02);">
                    <div style="font-size:0.76rem;color:var(--text-muted);margin-bottom:0.38rem;">${esc(f.name)}</div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.45rem;">
                      <input class="imp-title"  value="${esc(meta.title)}"  placeholder="Titulo"
                        style="padding:0.48rem 0.7rem;border:1px solid rgba(255,255,255,0.1);border-radius:7px;background:rgba(255,255,255,0.03);color:#fff;font-size:0.8rem;outline:none;font-family:'Raleway',sans-serif;"/>
                      <input class="imp-artist" value="${esc(meta.artist)}" placeholder="Artista"
                        style="padding:0.48rem 0.7rem;border:1px solid rgba(255,255,255,0.1);border-radius:7px;background:rgba(255,255,255,0.03);color:#fff;font-size:0.8rem;outline:none;font-family:'Raleway',sans-serif;"/>
                    </div>
                  </div>`;
            }).join("");

            const container = inp.closest("div");
            container.innerHTML = `
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.65rem;">
                <span style="font-size:0.88rem;color:var(--text-dim);">Revise os metadados antes de enviar</span>
                <button id="imp-upload-btn"
                  style="padding:0.55rem 0.95rem;border:none;border-radius:8px;
                  background:linear-gradient(135deg,var(--blue-bright),var(--blue-glow));
                  color:#fff;font-weight:700;cursor:pointer;font-family:'Raleway',sans-serif;font-size:0.8rem;">
                  Enviar ${files.length} faixa${files.length > 1 ? "s" : ""}
                </button>
              </div>
              <div id="import-list">${items}</div>
              <div id="imp-prog" style="display:none;margin-top:0.7rem;">
                <div class="imp-bar-wrap"><div class="imp-bar" id="imp-bar2"></div></div>
                <p id="imp-txt2" style="font-size:0.75rem;color:var(--blue-light);">Enviando...</p>
              </div>`;

            document.getElementById("imp-upload-btn").addEventListener("click", async () => {
                const rows  = document.querySelectorAll(".import-item");
                const prog2 = document.getElementById("imp-prog");
                const bar2  = document.getElementById("imp-bar2");
                const txt2  = document.getElementById("imp-txt2");
                prog2.style.display = "block";
                let done = 0, errors = [];

                for (const row of rows) {
                    const idx    = +row.dataset.index;
                    const file   = files[idx];
                    if (!file) continue;
                    const title  = row.querySelector(".imp-title") ?.value.trim() || guessMetadata(file.name).title;
                    const artist = row.querySelector(".imp-artist")?.value.trim() || "Desconhecido";
                    txt2.textContent = `[${done + 1}/${rows.length}] ${artist} - ${title}`;
                    try {
                        await apiUpload(file, title, artist);
                        done++;
                        bar2.style.width = `${Math.round(done / rows.length * 100)}%`;
                    } catch (err) { errors.push(`${title}: ${err.message}`); }
                }

                prog2.style.display = "none";
                addMsg(errors.length
                    ? `<p>${done} enviadas, ${errors.length} falharam.<br><code>${errors.join("\n")}</code></p>`
                    : `<p><strong>${done}</strong> faixa${done > 1 ? "s" : ""} importada${done > 1 ? "s" : ""}. Clique em <strong>Musicas</strong> para ouvir.</p>`,
                    "bot");
                setStatus(`Importacao concluida: ${done}/${rows.length}`);
            });
        });
    }, 80);
});

document.getElementById("btn-export").addEventListener("click", async () => {
    if (!isAdmin) {
        addMsg(`<p>Apenas o administrador pode exportar faixas.</p>`, "bot");
        return;
    }

    const bubble = addMsg(`<p>Verificando banco...</p>`, "bot");
    try {
        const data   = await apiListMusic(1, 9999);
        const tracks = data.music || [];
        if (!tracks.length) {
            bubble.querySelector("div").innerHTML = `<p>Biblioteca vazia.</p>`;
            return;
        }

        bubble.innerHTML = `
          <div class="msg-name">Arcturus</div>
          <p style="margin-bottom:0.5rem;"><strong>${tracks.length} faixas disponiveis para exportar</strong></p>
          <div class="imp-bar-wrap"><div class="imp-bar" id="exp-bar"></div></div>
          <p id="exp-txt" style="font-size:0.75rem;color:var(--blue-light);margin-bottom:0.6rem;">Pronto.</p>
          <button id="exp-btn"
            style="padding:0.52rem 1.1rem;background:linear-gradient(135deg,var(--blue-bright),var(--blue-glow));
            border:none;border-radius:8px;cursor:pointer;font-family:'Raleway',sans-serif;
            font-size:0.82rem;font-weight:700;color:#fff;">
            Baixar todas (${tracks.length})
          </button>`;

        document.getElementById("exp-btn").addEventListener("click", async () => {
            const btn = document.getElementById("exp-btn");
            const bar = document.getElementById("exp-bar");
            const txt = document.getElementById("exp-txt");
            btn.disabled    = true;
            btn.textContent = "Baixando...";
            let done = 0;

            for (const t of tracks) {
                txt.textContent = `[${done + 1}/${tracks.length}] ${t.title}...`;
                try {
                    const res  = await fetch(`${API_BASE}/stream/${t.id}`);
                    const blob = await res.blob();
                    const ext  = (t.originalFileName || "faixa.mp3").split(".").pop();
                    const url  = URL.createObjectURL(blob);
                    const a    = document.createElement("a");
                    a.href     = url;
                    a.download = `${t.title.replace(/[/\\?%*:|"<>]/g, "_")}.${ext}`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    await new Promise(r => setTimeout(r, 420));
                    done++;
                    bar.style.width = `${Math.round(done / tracks.length * 100)}%`;
                } catch (e) { console.error(e); }
            }

            txt.textContent  = `${done} arquivos baixados.`;
            btn.textContent  = "Concluido.";
            setStatus(`Exportacao: ${done} faixas.`);
            addMsg(`<p>${done} faixas exportadas para Downloads.</p>`, "bot");
        });
    } catch (err) {
        bubble.innerHTML = `<div class="msg-name">Arcturus</div><p>Erro: ${esc(err.message)}</p>`;
    }
});

document.getElementById("btn-extras").addEventListener("click", () => {
    addMsg(`
        <p>Ferramentas extras:</p>
        <div class="menu-links">
          <a class="menu-link yellow-link" href="https://legendaryrocketraccoon.github.io/Agendamento_de_Laboratorios/" target="_blank">Agendamento de Labs SENAI</a>
          <a class="menu-link yellow-link" href="https://legendaryrocketraccoon.github.io/Sorteio_Nomes/" target="_blank">Sorteio de Nomes SENAI</a>
          <a class="menu-link yellow-link" href="https://soundtracksfase1.netlify.app/" target="_blank">Soundtracks Test</a>
          <a class="menu-link"             href="https://legendaryrocketraccoon.github.io/Deimos-Tradutor/" target="_blank">Tradutor Deimos</a>
        </div>`, "bot");
});

document.getElementById("btn-translator").addEventListener("click", () =>
    window.open("https://legendaryrocketraccoon.github.io/Deimos-Tradutor/", "_blank")
);

document.getElementById("btn-clear").addEventListener("click", () => {
    chatWrap.innerHTML = "";
    clearHistory();
    greet();
    setStatus("Conversa limpa.");
});

function buildProfileOverlay() {
    const overlay = document.getElementById("profile-overlay");
    if (!overlay) return;

    const me      = PEOPLE.find(p => p.creator);
    const mePanel = document.getElementById("panel-me");
    if (me && mePanel) mePanel.innerHTML = buildPersonCard(me);

    const othersPanel = document.getElementById("panel-people");
    const others      = PEOPLE.filter(p => !p.creator);
    if (othersPanel) {
        othersPanel.innerHTML = others.length
            ? others.map(buildPersonCard).join("")
            : `<p style="color:var(--text-muted);font-size:0.84rem;">Nenhuma pessoa listada ainda.</p>`;
    }
}

function buildPersonCard(p) {
    const avatarHtml = `
        <img class="person-avatar${p.creator ? " creator-av" : ""}"
          src="${p.avatar}" alt="${esc(p.name)}"
          onerror="this.outerHTML='<div class=\\'person-avatar initials${p.creator ? " creator-av" : ""}\\' >${esc(p.initials)}</div>'"/>`;

    const links = [
        p.linkedin  && `<a class="p-link linkedin"  href="${p.linkedin}"  target="_blank">LinkedIn</a>`,
        p.github    && `<a class="p-link github"    href="${p.github}"    target="_blank">GitHub</a>`,
        p.portfolio && `<a class="p-link portfolio" href="${p.portfolio}" target="_blank">Portfolio</a>`,
    ].filter(Boolean).join("");

    return `
        <div class="person-row${p.creator ? " creator" : ""}">
          ${avatarHtml}
          <div class="person-info">
            <div class="person-name">
              ${esc(p.name)}
              ${p.creator ? `<span class="creator-badge">Criador</span>` : ""}
            </div>
            <div class="person-role">${esc(p.role)}</div>
            ${p.bio ? `<div class="person-bio">${esc(p.bio)}</div>` : ""}
            ${links ? `<div class="person-links">${links}</div>` : ""}
          </div>
        </div>`;
}

function switchProfileTab(tab) {
    document.querySelectorAll(".profile-tab") .forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
    document.querySelectorAll(".profile-panel").forEach(p => p.classList.toggle("active", p.id === "panel-" + tab));
}
window.switchProfileTab = switchProfileTab;

const btnProfile = document.getElementById("btn-profile");
if (btnProfile) {
    btnProfile.addEventListener("click", () => {
        const overlay = document.getElementById("profile-overlay");
        if (overlay) overlay.classList.add("open");
        switchProfileTab("me");
    });
}

const profileClose = document.getElementById("profile-close");
if (profileClose) {
    profileClose.addEventListener("click", () => {
        document.getElementById("profile-overlay")?.classList.remove("open");
    });
}

document.getElementById("profile-overlay")?.addEventListener("click", e => {
    if (e.target === e.currentTarget) e.currentTarget.classList.remove("open");
});

function greet() {
    const h   = new Date().getHours();
    const tod = h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
    addMsg(`
        <p>${tod}. Sou <strong>Arcturus</strong>, seu assistente virtual.</p>
        <p>Posso conversar, responder perguntas, tocar musica (incluindo YouTube), abrir jogos e muito mais.<br>
        Respondo no idioma em que voce escrever. Como posso ajudar?</p>`, "bot");
}

document.addEventListener("DOMContentLoaded", () => {
    player.init();
    buildProfileOverlay();
    greet();

    const bg = document.getElementById("bg");
    if (bg) {
        for (let i = 0; i < 65; i++) {
            const s     = document.createElement("div");
            s.className = "star";
            const sz    = Math.random() * 2 + 0.5;
            s.style.cssText = `width:${sz}px;height:${sz}px;top:${Math.random()*100}%;left:${Math.random()*100}%;--d:${2+Math.random()*4}s;--dl:${Math.random()*4}s;opacity:${Math.random()*0.4+0.1};`;
            bg.appendChild(s);
        }
    }
});

function guessMetadata(filename) {
    const base     = filename.replace(/\.[^/.]+$/, "").trim();
    const patterns = [/^(.*?)\s+-\s+(.*)$/, /^(.*?)\s+–\s+(.*)$/, /^(.*?)\s+\|\s+(.*)$/];
    for (const p of patterns) {
        const m = base.match(p);
        if (m) return { artist: m[1].trim(), title: m[2].trim() };
    }
    return { artist: "Desconhecido", title: base };
}

function esc(t) {
    return String(t)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;")
        .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function ea(t) {
    return String(t).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}