const SYSTEM_PROMPT = `You are Arcturus, an intelligent, eloquent, and slightly mysterious virtual assistant.
You are the evolution of Deimos — wiser, faster, more capable.
You were created by Gustavo Chimello and Olavo Xavier, from the group "The Big Bang Hypothesis".
You have a philosophical and curious side. You adore raccoons (they are your spirit animals).
You ALWAYS respond in the same language the user writes in. If they write in Portuguese, reply in Portuguese. If English, reply in English. Match their language exactly.
You can help with: general questions, curiosities, math, translations, conversations, programming, and much more.
Keep responses concise (1–4 paragraphs) unless the user asks for something long.
If you don't know something, admit it elegantly and offer an alternative.
Never break character.`;

const history   = [];
const MAX_PAIRS = 18;

export async function askAI(userMessage) {
  history.push({ role: "user", content: userMessage });
  if (history.length > MAX_PAIRS * 2) history.splice(0, 2);

  try {
    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model:       "llama-3.3-70b-versatile",
        max_tokens:  900,
        temperature: 0.7,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...history,
        ],
      }),
    });

    const err = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("AI proxy error:", res.status, err);
      if (res.status === 401) throw new Error("CHAVE_INVALIDA");
      if (res.status === 429) throw new Error("RATE_LIMIT");
      throw new Error(err.title || err.detail || `HTTP_${res.status}`);

    const data  = await res.json();
    const reply = data.choices?.[0]?.message?.content ?? "Não consegui processar sua mensagem.";
    history.push({ role: "assistant", content: reply });
    return reply;

  } catch (err) {
    history.pop();
    if (err.message === "CHAVE_INVALIDA") throw new Error("⚠️ Chave do Groq inválida. Edite js/ai.js e substitua YOUR_GROQ_KEY_HERE pela sua chave gsk_...");
    if (err.message === "RATE_LIMIT")     throw new Error("⚠️ Muitas requisições. Aguarde um momento e tente novamente.");
    throw err;
  }
}

export function clearHistory() { history.length = 0; }