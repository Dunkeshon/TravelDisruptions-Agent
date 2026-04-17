// Configuration
const CONFIG = {
    DEFAULT_HOST: 'http://localhost:11434',
    MODEL: 'gemma:4-eb4',
    SYSTEM_PROMPT_FILE: './systemprompt.txt'
};

// State
let conversationHistory = [];
let systemPrompt = '';
let isLoading = false;

// DOM Elements
const messagesArea = document.getElementById('messagesArea');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const typingIndicator = document.getElementById('typingIndicator');
const ollamaHostInput = document.getElementById('ollamaHost');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadConfiguration();
    loadSystemPrompt();
    attachEventListeners();
    showWelcomeMessage();
});

function loadConfiguration() {
    const savedHost = localStorage.getItem('ollamaHost');
    if (savedHost) {
        ollamaHostInput.value = savedHost;
    } else {
        ollamaHostInput.value = CONFIG.DEFAULT_HOST;
    }
}

function saveConfiguration() {
    localStorage.setItem('ollamaHost', ollamaHostInput.value);
}

async function loadSystemPrompt() {
    try {
        const response = await fetch(CONFIG.SYSTEM_PROMPT_FILE);
        if (response.ok) {
            systemPrompt = await response.text();
            console.log('System prompt loaded');
        }
    } catch (error) {
        console.warn('Could not load system prompt from file:', error);
        console.log('You can paste the system prompt in the browser console:');
        console.log('window.systemPrompt = "<your-prompt-here>"');
    }
}

function attachEventListeners() {
    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    ollamaHostInput.addEventListener('change', saveConfiguration);
}

function showWelcomeMessage() {
    addMessage(
        'system',
        'Welcome to Flow. I have initialized your backpacking profile. Are you planning a multi-day trek or a nomadic urban journey? I can help optimize your gear weight and terrain strategy.',
        '10:42 AM'
    );
}

async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message || isLoading) return;

    saveConfiguration();

    // Add user message
    const timestamp = new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
    });
    addMessage('user', message, timestamp);
    
    conversationHistory.push({
        role: 'user',
        content: message
    });

    messageInput.value = '';
    messageInput.focus();

    // Show typing indicator
    isLoading = true;
    typingIndicator.style.display = 'flex';
    scrollToBottom();

    try {
        const response = await generateResponse(message);
        
        // Hide typing indicator
        typingIndicator.style.display = 'none';
        
        // Add assistant response
        const responseTimestamp = new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
        addMessage('system', response, responseTimestamp);
        
        conversationHistory.push({
            role: 'assistant',
            content: response
        });
    } catch (error) {
        typingIndicator.style.display = 'none';
        const errorTimestamp = new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
        addMessage('system', `Error: ${error.message}`, errorTimestamp);
        console.error('Error:', error);
    } finally {
        isLoading = false;
    }
}

async function generateResponse(userMessage) {
    const host = ollamaHostInput.value.trim() || CONFIG.DEFAULT_HOST;
    const endpoint = `${host}/api/generate`;

    // Build the prompt context from conversation history
    let prompt = '';
    
    // Add system prompt if available
    if (systemPrompt) {
        prompt += `System: ${systemPrompt}\n\n`;
    }

    // Add conversation history (keep last 5 exchanges for context)
    const recentHistory = conversationHistory.slice(-10);
    recentHistory.forEach(msg => {
        if (msg.role === 'user') {
            prompt += `User: ${msg.content}\n`;
        } else {
            prompt += `Assistant: ${msg.content}\n`;
        }
    });

    prompt += `User: ${userMessage}\nAssistant:`;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: CONFIG.MODEL,
                prompt: prompt,
                stream: false,
                temperature: 0.7,
                top_p: 0.9,
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.response) {
            return data.response.trim();
        } else {
            throw new Error('No response from model');
        }
    } catch (error) {
        if (error instanceof TypeError) {
            throw new Error(`Cannot connect to Ollama at ${host}. Make sure Ollama is running and the host is correct.`);
        }
        throw error;
    }
}

function addMessage(role, content, timestamp) {
    const messageEl = document.createElement('div');
    messageEl.className = `message ${role}`;

    const contentEl = document.createElement('div');
    contentEl.className = 'message-content';
    contentEl.textContent = content;

    const timeEl = document.createElement('div');
    timeEl.className = 'message-time';
    timeEl.textContent = timestamp || getFormattedTime();

    messageEl.appendChild(contentEl);
    messageEl.appendChild(timeEl);

    messagesArea.appendChild(messageEl);
    scrollToBottom();
}

function scrollToBottom() {
    messagesArea.scrollTop = messagesArea.scrollHeight;
}

function getFormattedTime() {
    return new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
    });
}

// Console helpers
console.log('%cWayra Travel Companion initialized', 'color: #d32f2f; font-size: 16px; font-weight: bold;');
console.log('%cTo set system prompt via console: window.systemPrompt = "your prompt here"', 'color: #666;');
