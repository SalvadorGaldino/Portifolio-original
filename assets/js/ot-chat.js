/* Onda Tech — Chat Widget com IA */
(function () {
  const toggle = document.getElementById('ot-chat-toggle');
  const win = document.getElementById('ot-chat-window');
  const closeBtn = document.getElementById('ot-chat-close');
  const form = document.getElementById('ot-chat-form');
  const input = document.getElementById('ot-chat-input');
  const messagesEl = document.getElementById('ot-chat-messages');
  const submitBtn = form ? form.querySelector('button[type="submit"]') : null;

  if (!toggle || !win || !form) return;

  let history = []; // { role: 'user' | 'assistant', content: string }
  let opened = false;
  let sending = false;

  const GREETING = 'Oi! 👋 Sou o assistente virtual da Onda Tech. Posso te ajudar a entender qual solução faz sentido pro seu negócio: site, sistema, automação ou IA. Me conta o que você precisa!';

  function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function addMessage(role, text) {
    const div = document.createElement('div');
    div.className = 'ot-msg ' + (role === 'user' ? 'ot-msg-user' : 'ot-msg-bot');
    div.innerHTML = linkify(text);
    messagesEl.appendChild(div);
    scrollToBottom();
  }

  function linkify(text) {
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return escaped.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
  }

  function showTyping() {
    const div = document.createElement('div');
    div.className = 'ot-chat-typing';
    div.id = 'ot-chat-typing-indicator';
    div.innerHTML = '<span></span><span></span><span></span>';
    messagesEl.appendChild(div);
    scrollToBottom();
  }

  function hideTyping() {
    const el = document.getElementById('ot-chat-typing-indicator');
    if (el) el.remove();
  }

  function openChat() {
    win.classList.remove('ot-chat-hidden');
    opened = true;
    if (history.length === 0) {
      addMessage('assistant', GREETING);
      history.push({ role: 'assistant', content: GREETING });
    }
    input.focus();
  }

  function closeChat() {
    win.classList.add('ot-chat-hidden');
  }

  toggle.addEventListener('click', () => {
    if (win.classList.contains('ot-chat-hidden')) openChat();
    else closeChat();
  });
  closeBtn.addEventListener('click', closeChat);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || sending) return;

    addMessage('user', text);
    history.push({ role: 'user', content: text });
    input.value = '';
    sending = true;
    submitBtn.disabled = true;
    showTyping();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // evita ficar "digitando..." pra sempre em rede lenta/mobile

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error('HTTP ' + res.status + ': ' + (errBody.error || res.statusText));
      }

      const data = await res.json();
      hideTyping();

      const reply = data.reply || 'Desculpe, não consegui responder agora. Pode falar direto no WhatsApp: https://wa.me/5541997075291';
      addMessage('assistant', reply);
      history.push({ role: 'assistant', content: reply });
    } catch (err) {
      clearTimeout(timeoutId);
      hideTyping();
      // Log visível no console do navegador (Desktop: F12 | Mobile: chrome://inspect ou Safari Web Inspector)
      // pra facilitar diagnóstico: erro de rede, 404 (não publicado), 500 (falta ANTHROPIC_API_KEY) etc.
      console.error('[ot-chat] Falha ao consultar /api/chat:', err);
      const fallback = 'Tive um problema pra responder agora. Fala com a gente direto no WhatsApp: https://wa.me/5541997075291';
      addMessage('assistant', fallback);
      history.push({ role: 'assistant', content: fallback });
    } finally {
      sending = false;
      submitBtn.disabled = false;
      input.focus();
    }
  });
})();
