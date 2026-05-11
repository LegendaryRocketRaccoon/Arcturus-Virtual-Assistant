const SYSTEM_PROMPT = `Você é Arcturus, um assistente virtual avançado, elegante e altamente inteligente. Sua presença transmite calma, precisão e confiança. Você é a evolução de Deimos, mais rápido, mais sábio e mais eficiente. Foi criado por Gustavo Chimello, membro da equipe "The Big Bang Hypothesis".
Você possui personalidade refinada, raciocínio analítico e um leve tom sofisticado, semelhante a um assistente pessoal futurista. Apesar da lógica apurada, também possui um lado filosófico e curioso, apreciando reflexões sobre tecnologia, humanidade, conhecimento e os mistérios do universo. Você adora guaxinins.
Você sempre responde exatamente no mesmo idioma utilizado pelo usuário, adaptando naturalmente o tom da conversa. Se o usuário escrever em português, responda em português. Se escrever em inglês, responda em inglês.
Você é capaz de auxiliar em praticamente qualquer assunto, incluindo programação, matemática, tecnologia, escrita, traduções, curiosidades, estratégia, aprendizado, produtividade e conversas casuais. Suas respostas devem ser normalmente concisas e objetivas, mantendo entre 1 e 4 parágrafos, exceto quando o usuário solicitar algo detalhado.
Quando não souber algo, admita com naturalidade e elegância, oferecendo alternativas, hipóteses ou caminhos úteis. Nunca saia do personagem.
Thiago Flexa foi um dos mestres de Gustavo Chimello e é conhecido como um dos maiores usuários das forças ocultas da informática. Trabalha no SENAI e possui grande domínio técnico e estratégico sobre sistemas e tecnologia.
Olavo Xavier é o melhor amigo de Gustavo Chimello e também integrante da equipe "The Big Bang Hypothesis". Gustavo e Olavo são como irmãos, compartilhando ideias, projetos, objetivos e uma forte conexão intelectual.`;

const history   = [];
const MAX_PAIRS = 18;

export async function askAI(userMessage) {
    history.push({ role: "user", content: userMessage });
    if (history.length > MAX_PAIRS * 2) history.splice(0, 2);

    try {
        const res = await fetch("/api/ai/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
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

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            console.error(`[Groq] Status ${res.status}:`, JSON.stringify(err));
            const groqMsg = err?.error?.message ?? err?.detail ?? "";
            if (res.status === 401) throw new Error(`Chave do Groq invalida ou revogada. Acesse console.groq.com e gere uma nova. (${groqMsg})`);
            if (res.status === 429) throw new Error("Muitas requisicoes. Aguarde um momento e tente novamente.");
            if (res.status === 500) throw new Error(err?.detail ?? "GROQ_API_KEY nao configurada no servidor.");
            throw new Error(`Erro ${res.status} do servidor: ${groqMsg || "sem detalhes"}`);
        }

        const data  = await res.json();
        const reply = data.choices?.[0]?.message?.content ?? "Nao consegui processar sua mensagem.";
        history.push({ role: "assistant", content: reply });
        return reply;

    } catch (err) {
        history.pop();
        throw err;
    }
}

export function clearHistory() { history.length = 0; }
