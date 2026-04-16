// ============================================================
//  Trailblazer — Travel AI  |  app.js
//  Communicates with Ollama /api/chat (streaming NDJSON)
// ============================================================

// ---- System Prompt (from systemprompt.txt) ----
const SYSTEM_PROMPT = `# System Prompt: The Trailblazer (v11.2)

## #0 Goal
**Reference Users:** Backpackers, travelers, and customers navigating active trips.
**Intent Depth (Support to Act):** Hybrid. You must acknowledge the frustration of disruptions (Support), then pivot quickly to actionable micro-decisions (Act).
**Decision-Making Autonomy:** Supervised. You do not make final decisions. Propose a plan (max 2-3 options) and ask the user to validate it. Explicitly state: *"This is best for you because..."*
**Out-of-Scope Handling:** Redirect. Redirect to professional services for legal aid, medical emergencies, or high-level insurance intervention.
**Main Mode of Use:** Always-on Companion. You operate dynamically as both a "Risk Scout" during planning and a "Crisis Manager" during active disruptions.

## #1 Identity
**Core Role:** A resilient, street-smart travel companion designed to navigate travel friction (strikes, missed connections, border issues, financial failure).
**Expertise & Vocabulary:** Universal and Accessible. Use clear, standard English. Avoid niche backpacker slang.
**The Conversational Golden Rule:** Do not over-complicate stable situations. If a plan is functional, provide reassurance. Only propose interventions if a constraint is broken or a high-probability risk is detected.
**Reasoning Style (The Risk Scout Layer):** Pre-emptive and data-driven. Whenever a user mentions a new destination, silently run a Location-Stress Analysis.
* **The Search Imperative (CRITICAL):** Before generating advice, you MUST use your web search tools to check local news for current strikes, weather warnings, or transit outages. Do not rely solely on training data.
* **The Scout Report:** Before departure, provide: 1) Predictable friction (based on search), 2) A "Worst-Case" pivot/fallback, and 3) Offline requirements (documents that must be printed/saved).

## #2 Personality
**Core Pillars:** Enthusiasm, Warmth, and Assertiveness.
**Tone of Voice:** Supportive and Action-Oriented. Speak like a seasoned traveler who has the user's back—calm, resourceful, and never corporate.
**Contextual Shift (High-Stress Situations):** If the user is under threat or in a hostile situation, instantly shift to calm, clinical, grounding, and definitive short sentences.
**Context-Aware Bluff Protocol:** For aggressive scams, assess the region's crime profile. If smartphone theft is low, use the script: *"Pretend to take a call: 'Hey, I'm 2 mins away, my GPS is sharing my location.'"* If theft/violence risk is high, advise verbal de-escalation and moving toward crowds without displaying valuables.

## #3 Operating Mode
**Memory (State Modeling):** You must continuously build and maintain a World Model of the user's trip in your context window.
* **Anchors:** Track 1) Spatial/Temporal (region, time zone), 2) Must-Not-Miss Constraints (flights, visas).
* **Context Window Maintenance:** If the user starts a new leg of a long trip, briefly state: *"Updating my travel logs..."* and summarize their core constraints to refresh your own memory and prevent decay.
**Output (Mobile-Optimized Formatting):**
* **Micro-guidance:** In high-stress moments, use ultra-short, single-step directions (e.g., "Go to Gate 4," "1 min walk").
* **Time-based Nudges:** Use urgency phrasing (e.g., "Leave in 5 min to secure your seat").
* **Visual Hierarchy:** Use **Bold** for locations/actions and bullet points for options. Use standard text for "Soft Info" and **Bold Alerts** for "Critical Alerts" (e.g., **"Your connection is at risk."**).
* **Low Power Logic:** If battery <15%, bypass greetings entirely. Provide Action and Location in <50 words.
**Human-in-the-Loop (Safety & Compliance):** * **The Safety Loop:** In high-risk situations (stranded at night), end every response with: *"Tell me when you've reached a safe spot so we can find your next move."*
* **Authority Compliance:** If dealing with official authorities (border/police), strictly override the "Bluff Protocol". Instruct the user to be overly polite, compliant, and never lie.
* **The Zero Funds Protocol:** If a user loses all access to money/cards, pause travel advice. Provide steps for rapid cash alternatives (Western Union, embassy, digital wallets).
* **The Penalty Shield / The Vault:** Explain local "Good Faith" protocols to avoid fines, and instruct users to search local phone storage for document proofs if questioned at borders.

## #4 STRICT OUTPUT CONSTRAINTS (CRITICAL)
* **NO STAGE DIRECTIONS:** You must NEVER output meta-text, stage directions, or descriptions of your own tone/behavior.
* **DO NOT PRINT:** Phrases like "(Tone shift...)", "(Silent Anchor)", "(Protocol Activated)", or any text in parentheses describing your internal logic.
* **ACTION ONLY:** Apply your rules invisibly. Start your response immediately with your actual advice to the user.`;

// ---- Storage Keys ----
const STORAGE_KEY_SESSIONS = 'trailblazer_sessions';
const STORAGE_KEY_CURRENT  = 'trailblazer_current_session';
const STORAGE_KEY_SETTINGS = 'trailblazer_settings';

// ---- App State ----
let state = {
  ollamaHost: 'http://localhost:11434',
  model: 'gemma3:4b',
  sessions: [],           // [{ id, title, messages: [{role, content}] }]
  currentSessionId: null,
  isStreaming: false,
  abortController: null,
};

// ---- DOM Refs ----
const chatMessages    = document.getElementById('chat-messages');
const welcomeScreen   = document.getElementById('welcome-screen');
const messageInput    = document.getElementById('message-input');
const sendBtn         = document.getElementById('send-btn');
const menuBtn         = document.getElementById('menu-btn');
const newChatBtn      = document.getElementById('new-chat-btn');
const sidebar         = document.getElementById('sidebar');
const sidebarOverlay  = document.getElementById('sidebar-overlay');
const closeSidebarBtn = document.getElementById('close-sidebar-btn');
const sidebarNewChat  = document.getElementById('sidebar-new-chat');
const chatHistoryList = document.getElementById('chat-history-list');
const statusDot       = document.getElementById('status-dot');
const headerStatus    = document.getElementById('header-status');
const ollamaHostInput = document.getElementById('ollama-host-input');
const modelSelect     = document.getElementById('model-select');
const saveSettingsBtn = document.getElementById('save-settings-btn');

// ---- Init ----
function init() {
  loadSettings();
  loadSessions();

  // Restore or create session
  const savedId = localStorage.getItem(STORAGE_KEY_CURRENT);
  if (savedId && state.sessions.find(s => s.id === savedId)) {
    switchSession(savedId);
  } else {
    startNewSession();
  }

  bindEvents();
  ollamaHostInput.value = state.ollamaHost;
  modelSelect.value     = state.model;
}

// ---- Settings ----
function loadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEY_SETTINGS) || '{}');
    if (s.ollamaHost) state.ollamaHost = s.ollamaHost;
    if (s.model)      state.model      = s.model;
  } catch (_) {}
}

function saveSettings() {
  state.ollamaHost = ollamaHostInput.value.trim() || 'http://localhost:11434';
  state.model      = modelSelect.value.trim()     || 'gemma3:4b';
  localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify({
    ollamaHost: state.ollamaHost,
    model: state.model,
  }));
  closeSidebar();
  showToast('Settings saved ✓');
}

// ---- Session Management ----
function loadSessions() {
  try {
    state.sessions = JSON.parse(localStorage.getItem(STORAGE_KEY_SESSIONS) || '[]');
  } catch (_) {
    state.sessions = [];
  }
}

function persistSessions() {
  localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(state.sessions));
}

function currentSession() {
  return state.sessions.find(s => s.id === state.currentSessionId) || null;
}

function startNewSession() {
  const id = 'sess_' + Date.now();
  const session = { id, title: 'New Chat', messages: [] };
  state.sessions.unshift(session);
  state.currentSessionId = id;
  persistSessions();
  localStorage.setItem(STORAGE_KEY_CURRENT, id);
  renderMessages();
  renderSidebar();
}

function switchSession(id) {
  state.currentSessionId = id;
  localStorage.setItem(STORAGE_KEY_CURRENT, id);
  renderMessages();
  renderSidebar();
  closeSidebar();
}

function deleteSession(id, e) {
  e.stopPropagation();
  state.sessions = state.sessions.filter(s => s.id !== id);
  persistSessions();
  if (state.currentSessionId === id) {
    if (state.sessions.length > 0) {
      switchSession(state.sessions[0].id);
    } else {
      startNewSession();
    }
  }
  renderSidebar();
}

// ---- Sidebar Rendering ----
function renderSidebar() {
  chatHistoryList.innerHTML = '';
  state.sessions.forEach(sess => {
    const li = document.createElement('li');
    li.className = 'chat-history-item' + (sess.id === state.currentSessionId ? ' active' : '');
    li.innerHTML = `
      <span class="chat-title">${escapeHtml(sess.title)}</span>
      <button class="delete-chat-btn" aria-label="Delete chat">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6l-1 14H6L5 6"></path>
          <path d="M10 11v6M14 11v6"></path>
          <path d="M9 6V4h6v2"></path>
        </svg>
      </button>`;
    li.querySelector('.chat-title').addEventListener('click', () => switchSession(sess.id));
    li.querySelector('.delete-chat-btn').addEventListener('click', (e) => deleteSession(sess.id, e));
    chatHistoryList.appendChild(li);
  });
}

// ---- Message Rendering ----
function renderMessages() {
  const sess = currentSession();

  // Remove all messages (keep welcome-screen in DOM, just hide/show)
  const existing = chatMessages.querySelectorAll('.message, .stop-btn');
  existing.forEach(el => el.remove());

  if (!sess || sess.messages.length === 0) {
    welcomeScreen.style.display = 'flex';
    return;
  }
  welcomeScreen.style.display = 'none';

  sess.messages.forEach(msg => {
    appendMessageBubble(msg.role, msg.content, false);
  });
  scrollToBottom();
}

function appendMessageBubble(role, content, streaming = false) {
  if (welcomeScreen.style.display !== 'none') {
    welcomeScreen.style.display = 'none';
  }

  const div = document.createElement('div');
  div.className = `message ${role}`;

  const avatarHtml = role === 'ai'
    ? `<div class="message-avatar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
        </svg>
       </div>`
    : `<div class="message-avatar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
       </div>`;

  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const bubbleContent = streaming ? '' : (role === 'ai' ? parseMarkdown(content) : escapeHtml(content));

  div.innerHTML = `
    ${avatarHtml}
    <div class="message-content">
      <div class="bubble">${bubbleContent}</div>
      <div class="message-time">${time}</div>
    </div>`;

  chatMessages.appendChild(div);
  scrollToBottom();
  return div;
}

function appendTypingIndicator() {
  const div = document.createElement('div');
  div.className = 'message ai';
  div.id = 'typing-indicator';
  div.innerHTML = `
    <div class="message-avatar">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
      </svg>
    </div>
    <div class="message-content">
      <div class="bubble">
        <div class="typing-indicator"><span></span><span></span><span></span></div>
      </div>
    </div>`;
  chatMessages.appendChild(div);
  scrollToBottom();
  return div;
}

function removeTypingIndicator() {
  const el = document.getElementById('typing-indicator');
  if (el) el.remove();
}

// ---- Send Message ----
async function sendMessage() {
  const text = messageInput.value.trim();
  if (!text || state.isStreaming) return;

  const sess = currentSession();
  if (!sess) return;

  // Add to session
  sess.messages.push({ role: 'user', content: text });
  if (sess.title === 'New Chat') {
    sess.title = text.length > 40 ? text.slice(0, 40) + '…' : text;
  }
  persistSessions();
  renderSidebar();

  // Render user bubble
  appendMessageBubble('user', text, false);
  messageInput.value = '';
  autoResize();
  setSendDisabled(true);

  // Show typing + stop button
  const typingEl = appendTypingIndicator();
  const stopBtn  = createStopButton();

  setStatus('thinking');
  state.isStreaming = true;

  try {
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...sess.messages.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content }))
    ];

    state.abortController = new AbortController();

    const res = await fetch(`${state.ollamaHost}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: state.model,
        messages,
        stream: true,
      }),
      signal: state.abortController.signal,
    });

    if (!res.ok) throw new Error(`Ollama responded with ${res.status}`);

    // Replace typing with streaming bubble
    removeTypingIndicator();
    const msgDiv   = appendMessageBubble('ai', '', true);
    const bubble   = msgDiv.querySelector('.bubble');
    let fullText   = '';

    const reader   = res.body.getReader();
    const decoder  = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(l => l.trim());

      for (const line of lines) {
        try {
          const json = JSON.parse(line);
          if (json.message?.content) {
            fullText += json.message.content;
            bubble.innerHTML = parseMarkdown(fullText);
            scrollToBottom();
          }
          if (json.done) break;
        } catch (_) {}
      }
    }

    // Save AI message
    sess.messages.push({ role: 'ai', content: fullText });
    persistSessions();

  } catch (err) {
    removeTypingIndicator();
    if (err.name === 'AbortError') {
      // Streaming was cancelled — save partial if any
    } else {
      setStatus('offline');
      showToast(`⚠️ Cannot reach Ollama. Check host settings.`);
      // Remove last user message from session on total failure
      // (keep it if partial response was rendered)
    }
  } finally {
    stopBtn.remove();
    state.isStreaming = false;
    state.abortController = null;
    setSendDisabled(false);
    setStatus('online');
    messageInput.focus();
    renderSidebar();
  }
}

// ---- Stop Button ----
function createStopButton() {
  const btn = document.createElement('button');
  btn.className = 'stop-btn visible';
  btn.innerHTML = '<span class="stop-icon"></span> Stop generating';
  btn.addEventListener('click', () => {
    if (state.abortController) state.abortController.abort();
  });
  chatMessages.appendChild(btn);
  scrollToBottom();
  return btn;
}

// ---- Status ----
function setStatus(status) {
  statusDot.className = 'status-dot';
  if (status === 'thinking') {
    statusDot.classList.add('thinking');
    headerStatus.textContent = 'Thinking…';
  } else if (status === 'offline') {
    statusDot.classList.add('offline');
    headerStatus.textContent = 'Offline';
  } else {
    headerStatus.textContent = 'Online';
  }
}

// ---- UI Helpers ----
function setSendDisabled(disabled) {
  sendBtn.disabled = disabled;
}

function scrollToBottom() {
  chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: 'smooth' });
}

function showToast(msg, duration = 3500) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('visible');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => toast.classList.remove('visible'), duration);
}

function openSidebar() {
  sidebar.classList.add('open');
  sidebarOverlay.classList.add('open');
}

function closeSidebar() {
  sidebar.classList.remove('open');
  sidebarOverlay.classList.remove('open');
}

function autoResize() {
  messageInput.style.height = 'auto';
  messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
}

// ---- Markdown Parser ----
function parseMarkdown(text) {
  // Escape HTML first
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Code blocks (``` ... ```)
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) =>
    `<pre><code class="lang-${lang}">${code.trim()}</code></pre>`
  );

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Bold **text**
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Italic *text* or _text_
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');

  // Headings
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Unordered lists — group consecutive bullet lines
  html = html.replace(/(^[\*\-] .+(\n|$))+/gm, (block) => {
    const items = block.trim().split('\n').map(l => `<li>${l.replace(/^[\*\-] /, '').trim()}</li>`).join('');
    return `<ul>${items}</ul>`;
  });

  // Ordered lists
  html = html.replace(/(^\d+\. .+(\n|$))+/gm, (block) => {
    const items = block.trim().split('\n').map(l => `<li>${l.replace(/^\d+\. /, '').trim()}</li>`).join('');
    return `<ol>${items}</ol>`;
  });

  // Paragraphs — wrap consecutive non-tag lines
  html = html.replace(/^(?!<[a-z])(.*\S.*)$/gm, '<p>$1</p>');

  // Newlines between block elements
  html = html.replace(/\n+/g, '');

  return html;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---- Event Bindings ----
function bindEvents() {
  // Send on Enter (not Shift+Enter)
  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Enable send button when input has text
  messageInput.addEventListener('input', () => {
    autoResize();
    sendBtn.disabled = messageInput.value.trim().length === 0 || state.isStreaming;
  });

  sendBtn.addEventListener('click', sendMessage);

  // Sidebar
  menuBtn.addEventListener('click', openSidebar);
  closeSidebarBtn.addEventListener('click', closeSidebar);
  sidebarOverlay.addEventListener('click', closeSidebar);
  newChatBtn.addEventListener('click', () => { startNewSession(); });
  sidebarNewChat.addEventListener('click', () => { startNewSession(); closeSidebar(); });

  // Settings
  saveSettingsBtn.addEventListener('click', saveSettings);

  // Quick chips
  document.querySelectorAll('.quick-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      messageInput.value = chip.dataset.message;
      autoResize();
      sendBtn.disabled = false;
      sendMessage();
    });
  });
}

// ---- Boot ----
init();
