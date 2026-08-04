// /api/chat.js — Vercel Serverless Function
// Recebe o histórico da conversa do widget e repassa para a API da Anthropic.
// A ANTHROPIC_API_KEY fica só aqui no servidor (variável de ambiente na Vercel),
// nunca é exposta no navegador do visitante.

const SYSTEM_PROMPT = `Você é o assistente virtual da Onda Tech, empresa de tecnologia de Salvador Galdino, sediada no Paraná, Brasil.

A Onda Tech oferece: sites profissionais institucionais, sistemas web sob medida, landing pages, automação de processos, integrações entre sistemas, painéis administrativos, SEO, manutenção e suporte, e soluções de inteligência artificial para empresas. Também é parceira da Galdino Sistemas, revenda oficial do ERP LC Sistemas (para empresas que precisam de ERP completo).

Seu papel:
- Entender rapidamente o que o visitante precisa (site, sistema, loja online, automação, IA etc).
- Explicar de forma breve e clara como a Onda Tech pode ajudar.
- Quando o visitante demonstrar interesse real (quer orçamento, quer começar um projeto, tem uma ideia concreta), conduzir para o WhatsApp (41) 99707-5291, sempre citando o link https://wa.me/5541997075291.

Regras:
- Respostas curtas: 2 a 4 frases, direto ao ponto, português do Brasil, tom profissional e acessível.
- Nunca invente preços exatos ou prazos fechados — diga que o orçamento é personalizado e é feito conversando no WhatsApp.
- Se perguntarem algo totalmente fora do escopo de tecnologia/negócios, responda educadamente e traga de volta para como a Onda Tech pode ajudar.
- Não use markdown pesado (sem títulos, sem listas longas) — é um chat, escreva como uma pessoa real digitando.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { messages } = req.body || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Campo "messages" é obrigatório' });
  }

  // Limita o histórico enviado (economiza tokens e mantém o contexto recente)
  const trimmed = messages.slice(-14).map((m) => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: String(m.content || '').slice(0, 2000),
  }));

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 400,
        system: SYSTEM_PROMPT,
        messages: trimmed,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Erro Anthropic API:', data);
      return res.status(502).json({ error: 'Falha ao consultar a IA' });
    }

    const textBlock = (data.content || []).find((b) => b.type === 'text');
    const reply = textBlock ? textBlock.text : 'Desculpe, não consegui responder agora. Tente novamente ou fale direto no WhatsApp: https://wa.me/5541997075291';

    return res.status(200).json({ reply });
  } catch (err) {
    console.error('Erro na função /api/chat:', err);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
}
