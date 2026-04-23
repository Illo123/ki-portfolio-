// ===========================
// KI CHATBOT — INTERACTIONS
// ===========================

const chatArea    = document.getElementById('chatArea');
const messagesEl  = document.getElementById('messages');
const welcome     = document.getElementById('welcome');
const userInput   = document.getElementById('userInput');
const sendBtn     = document.getElementById('sendBtn');
const newChatBtn  = document.getElementById('newChatBtn');
const chatHistory = document.getElementById('chatHistory');

let conversationHistory = [];
let isStreaming = false;
let chatSessions = [];
let currentSessionId = null;

// ===========================
// TEXTAREA AUTO-RESIZE
// ===========================
userInput.addEventListener('input', () => {
  userInput.style.height = 'auto';
  userInput.style.height = Math.min(userInput.scrollHeight, 200) + 'px';
  sendBtn.disabled = userInput.value.trim() === '' || isStreaming;
});

// ===========================
// SEND ON ENTER (Shift+Enter = neue Zeile)
// ===========================
userInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    if (!sendBtn.disabled) sendMessage();
  }
});

sendBtn.addEventListener('click', sendMessage);

// ===========================
// SUGGESTION CHIPS
// ===========================
document.querySelectorAll('.suggestion').forEach(btn => {
  btn.addEventListener('click', () => {
    userInput.value = btn.dataset.text;
    userInput.dispatchEvent(new Event('input'));
    sendMessage();
  });
});

// ===========================
// NEUER CHAT
// ===========================
newChatBtn.addEventListener('click', startNewChat);

function startNewChat() {
  if (conversationHistory.length > 0) {
    saveSession();
  }
  conversationHistory = [];
  currentSessionId = null;
  messagesEl.innerHTML = '';
  welcome.style.display = 'flex';
  messagesEl.style.display = 'none';
  userInput.value = '';
  userInput.style.height = 'auto';
  sendBtn.disabled = true;
}

function saveSession() {
  if (conversationHistory.length === 0) return;
  const firstMsg = conversationHistory.find(m => m.role === 'user');
  if (!firstMsg) return;

  const label = firstMsg.content.slice(0, 42) + (firstMsg.content.length > 42 ? '…' : '');
  const id = Date.now();

  chatSessions.unshift({ id, label, history: [...conversationHistory] });
  currentSessionId = id;
  renderHistory();
}

function renderHistory() {
  const empty = chatHistory.querySelector('.history-empty');
  if (empty) empty.remove();

  chatHistory.innerHTML = '';
  chatSessions.forEach(session => {
    const item = document.createElement('div');
    item.className = 'history-item' + (session.id === currentSessionId ? ' active' : '');
    item.textContent = session.label;
    item.addEventListener('click', () => loadSession(session.id));
    chatHistory.appendChild(item);
  });
}

function loadSession(id) {
  const session = chatSessions.find(s => s.id === id);
  if (!session) return;
  currentSessionId = id;
  conversationHistory = [...session.history];
  renderHistory();
  rebuildMessages();
}

function rebuildMessages() {
  welcome.style.display = 'none';
  messagesEl.style.display = 'flex';
  messagesEl.innerHTML = '';
  conversationHistory.forEach(msg => {
    addMessage(msg.role, msg.content, false);
  });
  scrollToBottom();
}

// ===========================
// SEND MESSAGE
// ===========================
async function sendMessage() {
  const text = userInput.value.trim();
  if (!text || isStreaming) return;

  // Zeige Chat-Bereich, verstecke Welcome
  if (welcome.style.display !== 'none' || messagesEl.style.display === 'none') {
    welcome.style.display = 'none';
    messagesEl.style.display = 'flex';
  }

  // User-Nachricht hinzufügen
  addMessage('user', text);
  conversationHistory.push({ role: 'user', content: text });

  // Input zurücksetzen
  userInput.value = '';
  userInput.style.height = 'auto';
  sendBtn.disabled = true;
  isStreaming = true;

  // Typing indicator
  const typingEl = addTypingIndicator();
  scrollToBottom();

  // Streaming response
  try {
    const response = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: conversationHistory }),
    });

    typingEl.remove();

    const assistantEl = addMessage('assistant', '', false);
    const textEl = assistantEl.querySelector('.msg-text');
    const cursor = document.createElement('span');
    cursor.className = 'cursor-blink';
    textEl.appendChild(cursor);

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6);
        if (payload === '[DONE]') break;

        try {
          const { text: chunk } = JSON.parse(payload);
          fullText += chunk;
          textEl.innerHTML = renderMarkdown(fullText);
          textEl.appendChild(cursor);
          scrollToBottom();
        } catch {}
      }
    }

    cursor.remove();
    textEl.innerHTML = renderMarkdown(fullText);
    conversationHistory.push({ role: 'assistant', content: fullText });

  } catch (err) {
    typingEl?.remove();
    addMessage('assistant', '⚠️ Fehler beim Verbinden. Ist der Server gestartet?', false);
  }

  isStreaming = false;
  sendBtn.disabled = userInput.value.trim() === '';
  scrollToBottom();
}

// ===========================
// DOM HELPERS
// ===========================
function addMessage(role, content, animate = true) {
  const isUser = role === 'user';

  const msg = document.createElement('div');
  msg.className = `msg ${role}`;
  if (!animate) msg.style.animation = 'none';

  msg.innerHTML = `
    <div class="msg-avatar">${isUser ? 'Du' : 'AI'}</div>
    <div class="msg-content">
      <div class="msg-name">${isUser ? 'Du' : 'Claude'}</div>
      <div class="msg-text">${isUser ? escapeHtml(content) : renderMarkdown(content)}</div>
    </div>
  `;

  messagesEl.appendChild(msg);
  if (animate) scrollToBottom();
  return msg;
}

function addTypingIndicator() {
  const msg = document.createElement('div');
  msg.className = 'msg assistant';
  msg.innerHTML = `
    <div class="msg-avatar">AI</div>
    <div class="msg-content">
      <div class="msg-name">Claude</div>
      <div class="typing-indicator">
        <span></span><span></span><span></span>
      </div>
    </div>
  `;
  messagesEl.appendChild(msg);
  return msg;
}

function scrollToBottom() {
  chatArea.scrollTo({ top: chatArea.scrollHeight, behavior: 'smooth' });
}

// ===========================
// MARKDOWN RENDERER (minimal)
// ===========================
function renderMarkdown(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Code-Blöcke
    .replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    // Inline-Code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Fett
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Kursiv
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    // Überschriften
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Listen
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    // Zeilenumbrüche
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
}
