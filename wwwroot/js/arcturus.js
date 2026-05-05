import { player, extractYouTubeId, apiListMusic, apiStats, apiUpload, apiDelete, API_BASE } from "./player.js";
import { askAI, clearHistory } from "./ai.js";

import { initializeApp }                        from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const FB = {
  apiKey: "AIzaSyB8Ji1solW904fstUbIUcHCD8RnRn8CTsI", authDomain: "deimos---ia.firebaseapp.com",
  projectId: "deimos---ia", storageBucket: "deimos---ia.firebasestorage.app",
  messagingSenderId: "418940529875", appId: "1:418940529875:web:feebf6b23874ab81d8b826",
};
const auth = getAuth(initializeApp(FB));
onAuthStateChanged(auth, user => {
  if (!user) { window.location.href = "index.html"; return; }
  document.getElementById("user-email").textContent = user.email;
});
document.getElementById("logout-btn").addEventListener("click", () =>
  signOut(auth).then(() => window.location.href = "index.html"));

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
  u.lang="pt-BR"; u.pitch=1; u.rate=1; u.volume=1;
  u.voice = synth.getVoices().find(v => v.lang.startsWith("pt")) || null;
  synth.speak(u);
}
voiceBtn.addEventListener("click", () => {
  voiceOn = !voiceOn;
  voiceBtn.classList.toggle("muted", !voiceOn);
  voiceBtn.textContent = voiceOn ? "🔊" : "🔇";
  setStatus(voiceOn ? "Voz ativada." : "Voz desativada.");
});
function setStatus(msg) { statusText.textContent = msg; }

function addMsg(html, role) {
  const wrap = document.createElement("div"); wrap.className = `msg ${role}`;
  if (role === "bot") {
    const av = document.createElement("img");
    av.className="msg-avatar bot-av"; av.alt="Arcturus"; av.src="img/Arcturus.png";
    wrap.appendChild(av);
  } else {
    const av = document.createElement("div");
    av.className="msg-avatar user-av"; av.textContent="U"; wrap.appendChild(av);
  }
  const bubble = document.createElement("div"); bubble.className="msg-bubble";
  if (role==="bot") {
    const b=document.createElement("div"); b.className="msg-name"; b.textContent="Arcturus";
    bubble.appendChild(b);
  }
  const body=document.createElement("div"); body.innerHTML=html;
  bubble.appendChild(body); wrap.appendChild(bubble);
  chatWrap.appendChild(wrap); chatWrap.scrollTop=chatWrap.scrollHeight;
  return bubble;
}

function showTyping() {
  const wrap=document.createElement("div"); wrap.className="msg bot"; wrap.id="typing-indicator";
  const av=document.createElement("img"); av.className="msg-avatar bot-av"; av.src="img/Arcturus.png";
  const bubble=document.createElement("div"); bubble.className="msg-bubble";
  bubble.innerHTML=`<div class="msg-name">Arcturus</div><div class="typing-dots"><span></span><span></span><span></span></div>`;
  wrap.appendChild(av); wrap.appendChild(bubble); chatWrap.appendChild(wrap);
  chatWrap.scrollTop=chatWrap.scrollHeight; return wrap;
}

async function sendMessage() {
  const text=inputEl.value.trim(); if (!text) return;
  addMsg(esc(text),"user"); inputEl.value=""; sendBtn.disabled=true;
  setStatus("Arcturus está pensando...");

  if (/(?:youtube\.com|youtu\.be)/.test(text)) {
    const id=extractYouTubeId(text);
    if (id && player.playYouTube(text,`YouTube — ${id}`)) {
      addMsg(`<p>▶ Reproduzindo do YouTube.</p>`,"bot");
      setStatus("▶ Tocando YouTube."); sendBtn.disabled=false; return;
    }
  }

  const typing=showTyping();
  try {
    const reply=await askAI(text); typing.remove();
    const yt=reply.match(/https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\/\S+/);
    if (yt) player.playYouTube(yt[0],"YouTube");
    const fmt=reply
      .replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/\*(.+?)\*/g,"<em>$1</em>")
      .replace(/`(.+?)`/g,"<code>$1</code>").replace(/\n\n/g,"</p><p>").replace(/\n/g,"<br>");
    addMsg(`<p>${fmt}</p>`,"bot"); speak(reply.replace(/<[^>]+>/g,"")); setStatus("Pronto.");
  } catch(err) {
    typing.remove();
    const msg=err.message?.startsWith("⚠️")?err.message:"⚠️ Erro de conexão.";
    addMsg(`<p>${msg}</p>`,"bot"); setStatus("Erro.");
  }
  sendBtn.disabled=false; inputEl.focus();
}
sendBtn.addEventListener("click", sendMessage);
inputEl.addEventListener("keydown", e => { if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();} });


document.getElementById("btn-games").addEventListener("click", () => {
  addMsg(`<p>🎮 Escolha um jogo:</p><div class="menu-links">
    <a class="menu-link" href="https://theapplejuicer.github.io/Mate-O-Dragao/" target="_blank">⚔️ Matar o Dragão</a>
    <a class="menu-link" href="https://legendaryrocketraccoon.github.io/Pac-Man-Test/" target="_blank">👾 Pac-Man Test</a>
  </div>`,"bot");
});

document.getElementById("btn-music").addEventListener("click", async () => {
  const bubble = addMsg(`<p>🔄 Carregando biblioteca...</p>`,"bot");
  try {
    const [data, stats] = await Promise.all([apiListMusic(), apiStats()]);
    const tracks = data.music || [];
    window._arcTracks = tracks;

    if (!tracks.length) {
      bubble.querySelector("div").innerHTML =
        `<p>📭 Banco vazio. Clique em <strong>📥 Importar</strong> para carregar as músicas da pasta <code>musicas/</code>.</p>`;
      return;
    }

    const list = tracks.map(t => `
      <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.35rem;">
        <button class="music-btn play-btn" style="flex:1;text-align:left;"
          data-id="${t.id}" data-title="${ea(t.title)}" data-artist="${ea(t.artist)}">
          <span class="track-icon">🎵</span>
          <span class="track-info">
            <span class="track-title">${esc(t.title)}</span>
            <span class="track-artist">${esc(t.artist)}</span>
          </span>
        </button>
        <button class="del-btn" style="flex-shrink:0;padding:0.4rem 0.65rem;color:#ff6060;"
          data-id="${t.id}" data-title="${ea(t.title)}" title="Excluir">🗑</button>
      </div>`).join("");

    bubble.innerHTML = `
      <div class="msg-name">Arcturus</div>
      <div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:0.7rem;">
        📊 ${stats.totalMusic} músicas · ${stats.totalSizeMB} MB no banco SQL
      </div>
      <p style="margin-bottom:0.6rem;">🎶 Clique para tocar:</p>${list}`;

    bubble.querySelectorAll(".play-btn").forEach(btn => btn.addEventListener("click", () => {
      player.playFromSQL(+btn.dataset.id, btn.dataset.title, btn.dataset.artist);
      setStatus(`▶ Tocando: ${btn.dataset.title}`);
    }));
    bubble.querySelectorAll(".del-btn").forEach(btn => btn.addEventListener("click", async () => {
      if (!confirm(`Excluir "${btn.dataset.title}" do banco?`)) return;
      try {
        await apiDelete(+btn.dataset.id);
        btn.closest("div").remove();
        window._arcTracks = (window._arcTracks||[]).filter(t=>t.id!==+btn.dataset.id);
        setStatus("Música excluída.");
      } catch(e) { alert("Erro: "+e.message); }
    }));

  } catch(err) {
    bubble.innerHTML = `<div class="msg-name">Arcturus</div>
      <p>⚠️ Servidor não encontrado.<br>
      <small style="color:var(--text-muted)">Rode <code>dotnet run</code> na pasta do Arcturus e acesse <a href="http://localhost:5200" style="color:var(--blue-light)">localhost:5200</a></small></p>`;
  }
});


document.getElementById("btn-import").addEventListener("click", () => {
  addMsg(`
    <div>
      <p style="margin-bottom:0.5rem;">📥 <strong>Importar músicas para o banco SQL</strong></p>
      <p style="font-size:0.82rem;color:var(--text-dim);margin-bottom:0.8rem;">
        Selecione os arquivos da pasta <code>musicas/</code>.<br>
        Serão salvos no banco SQL automaticamente — igual ao <code>dotnet run import</code> fazia.
      </p>
      <label style="display:inline-flex;align-items:center;gap:0.5rem;cursor:pointer;
        padding:0.6rem 1.1rem;background:rgba(58,123,213,0.12);
        border:1px dashed rgba(58,123,213,0.4);border-radius:8px;
        color:var(--blue-light);font-size:0.85rem;font-weight:600;">
        📂 Selecionar arquivos da pasta musicas/
        <input type="file" id="import-files" accept=".mp3,.mp4,.m4a,.wav,.ogg,.webm" multiple style="display:none"/>
      </label>
      <div id="imp-prog" style="display:none;margin-top:0.9rem;">
        <div style="height:5px;background:var(--blue-mid);border-radius:3px;margin-bottom:0.5rem;overflow:hidden;">
          <div id="imp-bar" style="height:100%;width:0%;background:var(--blue-glow);transition:width 0.25s;border-radius:3px;"></div>
        </div>
        <p id="imp-txt" style="font-size:0.78rem;color:var(--blue-light);">Aguardando...</p>
      </div>
    </div>
  `,"bot");

  setTimeout(() => {
    const inp  = document.getElementById("import-files");
    const prog = document.getElementById("imp-prog");
    const bar  = document.getElementById("imp-bar");
    const txt  = document.getElementById("imp-txt");
    if (!inp) return;

    inp.addEventListener("change", async e => {
      const files = Array.from(e.target.files).filter(f=>/\.(mp3|mp4|m4a|wav|ogg|webm)$/i.test(f.name));
      if (!files.length) return;
      prog.style.display = "block";
      let done=0, erros=[];

      for (const f of files) {
        const title = f.name.replace(/\.[^/.]+$/,"");
        txt.textContent = `[${done+1}/${files.length}] ${title}`;
        try {
          await apiUpload(f, title);
          done++;
          bar.style.width = `${Math.round(done/files.length*100)}%`;
        } catch(err) { erros.push(`${title}: ${err.message}`); }
      }

      prog.style.display="none";
      if (erros.length) {
        addMsg(`<p>📥 ${done} importadas, ${erros.length} com erro:<br><small>${erros.slice(0,3).join("<br>")}</small></p>`,"bot");
      } else {
        addMsg(`<p><strong>${done}</strong> músicas importadas ao banco SQL.<br><small>Clique em <strong>🎵 Músicas</strong> para tocar.</small></p>`,"bot");
      }
      setStatus(`Importação: ${done}/${files.length}`);
    });
  }, 80);
});


document.getElementById("btn-export").addEventListener("click", async () => {
  const bubble = addMsg(`<p>💾 Verificando banco...</p>`,"bot");
  setStatus("Preparando exportação...");

  try {
    const data   = await apiListMusic(1, 9999);
    const tracks = data.music || [];

    if (!tracks.length) {
      bubble.querySelector("div").innerHTML = `<p>📭 Banco vazio, nada para exportar.</p>`; return;
    }

    bubble.innerHTML = `
      <div class="msg-name">Arcturus</div>
      <p style="margin-bottom:0.5rem;">💾 <strong>${tracks.length} músicas prontas para exportar</strong></p>
      <p style="font-size:0.82rem;color:var(--text-dim);margin-bottom:0.8rem;">
        Os arquivos serão baixados um por um para a sua pasta de Downloads.<br>
        <small>Substitui o <code>dotnet run export</code>.</small>
      </p>
      <div style="height:5px;background:var(--blue-mid);border-radius:3px;margin-bottom:0.5rem;overflow:hidden;">
        <div id="exp-bar" style="height:100%;width:0%;background:var(--yellow);transition:width 0.25s;border-radius:3px;"></div>
      </div>
      <p id="exp-txt" style="font-size:0.78rem;color:var(--blue-light);margin-bottom:0.7rem;">Pronto para baixar.</p>
      <button id="exp-btn" style="
        padding:0.55rem 1.2rem;
        background:linear-gradient(135deg,var(--blue-bright),var(--blue-glow));
        border:none;border-radius:8px;cursor:pointer;
        font-family:'Raleway',sans-serif;font-size:0.85rem;font-weight:700;color:#fff;">
        ⬇️ Exportar tudo (${tracks.length} músicas)
      </button>`;

    document.getElementById("exp-btn").addEventListener("click", async () => {
      const btn=document.getElementById("exp-btn");
      const bar=document.getElementById("exp-bar");
      const txt=document.getElementById("exp-txt");
      btn.disabled=true; btn.textContent="Baixando...";

      let done=0;
      for (const t of tracks) {
        txt.textContent=`[${done+1}/${tracks.length}] ${t.title}...`;
        try {
          const res  = await fetch(`${API_BASE}/stream/${t.id}`);
          const blob = await res.blob();
          const ext  = (t.originalFileName||"arquivo.mp3").split(".").pop();
          const url  = URL.createObjectURL(blob);
          const a    = document.createElement("a");
          a.href=url; a.download=`${t.title.replace(/[/\\?%*:|"<>]/g,"_")}.${ext}`;
          document.body.appendChild(a); a.click(); document.body.removeChild(a);
          URL.revokeObjectURL(url);
          await new Promise(r=>setTimeout(r,400)); // pausa para o browser aceitar
          done++;
          bar.style.width=`${Math.round(done/tracks.length*100)}%`;
        } catch(e) { console.error("Erro ao exportar",t.title,e); }
      }

      txt.textContent=`${done} arquivos baixados para Downloads.`;
      btn.textContent="Concluído.";
      setStatus(`Exportação: ${done} músicas.`);
      addMsg(`<p>${done} músicas exportadas para sua pasta de Downloads.</p>`,"bot");
    });

  } catch(err) {
    bubble.innerHTML=`<div class="msg-name">Arcturus</div>
      <p>⚠️ Erro: ${err.message}<br>
      <small>Servidor em <code>localhost:5200</code>?</small></p>`;
    setStatus("Erro na exportação.");
  }
});

document.getElementById("btn-extras").addEventListener("click", () => {
  addMsg(`<p>🔧 Ferramentas extras:</p><div class="menu-links">
    <a class="menu-link yellow-link" href="https://legendaryrocketraccoon.github.io/Agendamento_de_Laboratorios/" target="_blank">Agendamento de Labs SENAI</a>
    <a class="menu-link yellow-link" href="https://legendaryrocketraccoon.github.io/Sorteio_Nomes/" target="_blank">Sorteio de Nomes SENAI</a>
    <a class="menu-link yellow-link" href="https://soundtracksfase1.netlify.app/" target="_blank">Soundtracks Teste</a>
    <a class="menu-link"             href="https://legendaryrocketraccoon.github.io/Deimos-Tradutor/" target="_blank">🌐 Tradutor Deimos</a>
  </div>`,"bot");
});

document.getElementById("btn-translator").addEventListener("click", () =>
  window.open("https://legendaryrocketraccoon.github.io/Deimos-Tradutor/","_blank"));

document.getElementById("btn-clear").addEventListener("click", () => {
  chatWrap.innerHTML=""; clearHistory(); greet(); setStatus("Conversa limpa.");
});

function greet() {
  const h=new Date().getHours();
  const t=h<12?"Bom dia. ":h<18?"Boa tarde. ":"Boa noite. ";
  addMsg(`
    <p>${t}Eu sou o <strong>Arcturus</strong> — seu assistente virtual.</p>
    <p>Posso conversar, tocar músicas do banco SQL, abrir jogos e muito mais.<br>
    <em>Respondo no idioma em que você escrever.</em> Como posso ajudar?</p>
  `,"bot");
}

document.addEventListener("DOMContentLoaded", () => {
  player.init(); greet();
  const bg=document.getElementById("bg");
  for (let i=0;i<65;i++) {
    const s=document.createElement("div"); s.className="star";
    const sz=Math.random()*2+0.5;
    s.style.cssText=`width:${sz}px;height:${sz}px;top:${Math.random()*100}%;left:${Math.random()*100}%;--d:${2+Math.random()*4}s;--dl:${Math.random()*4}s;opacity:${Math.random()*0.4+0.1};`;
    bg.appendChild(s);
  }
});

function esc(t) { return String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
function ea(t)  { return String(t).replace(/"/g,"&quot;").replace(/'/g,"&#39;"); }
