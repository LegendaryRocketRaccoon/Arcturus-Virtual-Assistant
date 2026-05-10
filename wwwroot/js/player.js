export const API_BASE = "/api/music";

export async function apiListMusic(page = 1, pageSize = 100, search = "") {
    const q = new URLSearchParams({ page, pageSize });
    if (search) q.append("search", search);
    const r = await fetch(`${API_BASE}/list?${q}`);
    if (!r.ok) throw new Error(`Server returned ${r.status}`);
    return r.json();
}

export async function apiStats() {
    const r = await fetch(`${API_BASE}/stats`);
    if (!r.ok) throw new Error(`Server returned ${r.status}`);
    return r.json();
}

export async function apiUpload(file, title, artist = "Unknown") {
    const form = new FormData();
    form.append("file", file);
    form.append("title", title);
    form.append("artist", artist);
    const r = await fetch(`${API_BASE}/upload`, { method: "POST", body: form });
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || `HTTP ${r.status}`); }
    return r.json();
}

export async function apiDelete(id) {
    const r = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
}

export async function apiUpdateMusic(id, meta) {
    const r = await fetch(`${API_BASE}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(meta),
    });
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || `HTTP ${r.status}`); }
    return r.json();
}

export function extractYouTubeId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
        /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
    ];
    for (const p of patterns) { const m = url.match(p); if (m) return m[1]; }
    return null;
}

class ArcturusPlayer {
    constructor() {
        this.audio        = new Audio();
        this.isPlaying    = false;
        this.ytActive     = false;
        this._ready       = false;
        this._ytQueue     = null;
        this.currentTrack = null;

        // Elementos DOM — preenchidos em init()
        this.bar          = null;
        this.trackNameEl  = null;
        this.trackSubEl   = null;
        this.playPauseBtn = null;
        this.progressEl   = null;
        this.timeEl       = null;
        this.volEl        = null;
        this.ytContainer  = null;

        this._bindAudio();
        this._loadYTApi();
    }

    init() {
        this.bar          = document.getElementById("player-bar");
        this.trackNameEl  = document.getElementById("player-track-name");
        this.trackSubEl   = document.getElementById("player-track-sub");
        this.playPauseBtn = document.getElementById("play-pause-btn");
        this.progressEl   = document.getElementById("player-progress");
        this.timeEl       = document.getElementById("player-time");
        this.volEl        = document.getElementById("player-vol");
        this.ytContainer  = document.getElementById("yt-container");

        const prevBtn      = document.getElementById("prev-btn");
        const nextBtn      = document.getElementById("next-btn");
        const playPauseBtn = document.getElementById("play-pause-btn");
        const closeBtn     = document.getElementById("player-close");

        if (prevBtn)      prevBtn.addEventListener("click",      () => this.prev());
        if (nextBtn)      nextBtn.addEventListener("click",      () => this.next());
        if (playPauseBtn) playPauseBtn.addEventListener("click", () => this.togglePlay());
        if (closeBtn)     closeBtn.addEventListener("click",     () => this.close());

        if (this.progressEl) {
            this.progressEl.addEventListener("input", () => {
                if (!this.ytActive && this.audio.duration)
                    this.audio.currentTime = (this.progressEl.value / 100) * this.audio.duration;
            });
        }
        if (this.volEl) {
            this.volEl.addEventListener("input", () => { this.audio.volume = this.volEl.value / 100; });
        }

        this.audio.volume = 0.8;
        if (this.volEl) this.volEl.value = 80;
        this._ready = true;

        if (this._ytQueue) {
            this._playYT(this._ytQueue.id, this._ytQueue.title);
            this._ytQueue = null;
        }
    }

    playFromSQL(id, title, artist) {
        this._stopYT();
        this.currentTrack = { id, title, artist };
        this.audio.src    = `${API_BASE}/stream/${id}`;
        this.audio.play().catch(console.error);
        this.isPlaying    = true;
        this._ui(title, artist || "Arcturus Library");
        this._showBar();
    }

    next() {
        if (this.ytActive || !this.currentTrack) return;
        const list = window._arcTracks || [];
        const idx  = list.findIndex(t => t.id === this.currentTrack.id);
        if (idx >= 0 && idx < list.length - 1) {
            const t = list[idx + 1];
            this.playFromSQL(t.id, t.title, t.artist);
        }
    }

    prev() {
        if (this.ytActive || !this.currentTrack) return;
        const list = window._arcTracks || [];
        const idx  = list.findIndex(t => t.id === this.currentTrack.id);
        if (idx > 0) {
            const t = list[idx - 1];
            this.playFromSQL(t.id, t.title, t.artist);
        }
    }

    playYouTube(url, title = "YouTube") {
        const id = extractYouTubeId(url);
        if (!id) return false;
        if (!this._ready) { this._ytQueue = { id, title }; return true; }
        this._playYT(id, title);
        return true;
    }

    _playYT(id, title) {
        this._stopAudio();
        this.ytActive     = true;
        this.isPlaying    = true;
        this.currentTrack = null;
        this._ui(title, "YouTube");
        this._showBar();
        if (this.ytContainer) {
            this.ytContainer.style.display = "block";
            this.ytContainer.innerHTML     = `<iframe width="100%" height="100%"
                src="https://www.youtube.com/embed/${id}?autoplay=1"
                allow="autoplay; encrypted-media" allowfullscreen style="border:none"></iframe>`;
        }
        if (this.playPauseBtn) this.playPauseBtn.textContent = "⏸";
    }

    _stopYT() {
        this.ytActive = false;
        if (this.ytContainer) {
            this.ytContainer.innerHTML    = "";
            this.ytContainer.style.display = "none";
        }
    }

    _stopAudio() { this.audio.pause(); this.audio.src = ""; }

    togglePlay() {
        if (this.ytActive) {
            this._stopYT();
            this.isPlaying = false;
            if (this.playPauseBtn) this.playPauseBtn.textContent = "▶";
            return;
        }
        if (this.audio.paused) { this.audio.play(); this.isPlaying = true; }
        else                   { this.audio.pause(); this.isPlaying = false; }
        if (this.playPauseBtn) this.playPauseBtn.textContent = this.isPlaying ? "⏸" : "▶";
    }

    close() {
        this._stopYT();
        this._stopAudio();
        this.isPlaying = false;
        if (this.bar) this.bar.classList.remove("visible");
    }

    _showBar() {
        if (this.bar) this.bar.classList.add("visible");
    }

    _ui(name, sub) {
        if (!this._ready) return;
        if (this.trackNameEl)  this.trackNameEl.textContent  = name;
        if (this.trackSubEl)   this.trackSubEl.textContent   = sub;
        if (this.playPauseBtn) this.playPauseBtn.textContent = this.isPlaying ? "⏸" : "▶";
    }

    _bindAudio() {
        this.audio.addEventListener("timeupdate", () => {
            if (this.ytActive || !this.audio.duration || !this._ready) return;
            if (this.progressEl) this.progressEl.value = (this.audio.currentTime / this.audio.duration) * 100;
            if (this.timeEl)     this.timeEl.textContent = `${_fmt(this.audio.currentTime)} / ${_fmt(this.audio.duration)}`;
        });
        this.audio.addEventListener("ended", () => this.next());
        this.audio.addEventListener("error", () => {
            if (this.trackNameEl) this.trackNameEl.textContent = "Erro ao carregar faixa";
        });
    }

    _loadYTApi() {
        if (document.getElementById("yt-api-script")) return;
        const s = document.createElement("script");
        s.id    = "yt-api-script";
        s.src   = "https://www.youtube.com/iframe_api";
        s.async = true;
        document.head.appendChild(s);
    }
}

function _fmt(s) { return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`; }

export const player = new ArcturusPlayer();