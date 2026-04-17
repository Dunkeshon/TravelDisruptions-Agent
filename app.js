// Configuration
const CONFIG = {
    DEFAULT_HOST: 'http://localhost:11434',
    MODEL: 'gemma4:e4b',
    SYSTEM_PROMPT_FILE: './systemprompt.txt'
};

// State
let conversationHistory = [];
let systemPrompt = '';
let isLoading = false;
let userLocation = null;
let batteryLevel = 0;
let networkStatus = 'online';

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
    initializeSensors();
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

// Initialize phone sensors
function initializeSensors() {
    // Request geolocation
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy
                };
                console.log('Location acquired:', userLocation);
                updateHeaderStatus();
            },
            (error) => {
                console.log('Location access denied or unavailable:', error.message);
                updateHeaderStatus();
            },
            { timeout: 10000, maximumAge: 300000 }
        );
    }

    // Watch battery status
    if ('getBattery' in navigator) {
        navigator.getBattery().then((battery) => {
            batteryLevel = Math.round(battery.level * 100);
            battery.addEventListener('levelchange', () => {
                batteryLevel = Math.round(battery.level * 100);
                updateHeaderStatus();
            });
            updateHeaderStatus();
        });
    } else if ('battery' in navigator) {
        // Fallback for older API
        navigator.battery.addEventListener('levelchange', () => {
            batteryLevel = Math.round(navigator.battery.level * 100);
            updateHeaderStatus();
        });
        batteryLevel = Math.round(navigator.battery.level * 100);
        updateHeaderStatus();
    } else {
        console.log('Battery Status API not available');
    }

    // Monitor network status
    window.addEventListener('online', () => {
        networkStatus = 'online';
        updateHeaderStatus();
        console.log('Network: Online');
    });
    window.addEventListener('offline', () => {
        networkStatus = 'offline';
        updateHeaderStatus();
        console.log('Network: Offline - some features may be limited');
    });
    networkStatus = navigator.onLine ? 'online' : 'offline';
    updateHeaderStatus();
}

function showWelcomeMessage() {
    addMessage(
        'system',
        'Welcome to Wayra! I have initialized your travel companion. I can access your location, battery status, and network to give you better advice. Ask me about your travel plans!',
        '10:42 AM'
    );
}

// Update header status based on device sensors
function updateHeaderStatus() {
    const headerStatus = document.getElementById('headerStatus');
    if (!headerStatus) return;
    
    let statusText = 'Device Status:\n';
    let color = '#18181B';
    
    if (userLocation) {
        statusText += `📍 Location: ${userLocation.lat.toFixed(2)}, ${userLocation.lng.toFixed(2)}\n`;
        color = '#4CAF50';
    } else {
        statusText += `📍 Location: Requesting...\n`;
    }
    
    if (batteryLevel > 0) {
        statusText += `🔋 Battery: ${batteryLevel}%\n`;
        if (batteryLevel < 20) {
            color = '#FF5722';
        } else if (batteryLevel < 50) {
            color = '#FF9800';
        } else {
            color = '#4CAF50';
        }
    }
    
    statusText += `🌐 Network: ${networkStatus.toUpperCase()}`;
    if (networkStatus === 'offline') {
        color = '#FF5722';
    }
    
    headerStatus.title = statusText;
    headerStatus.style.color = color;
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
        const responseTimestamp = new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });

        // Create a thinking message that we'll update as the response streams
        const thinkingMessageEl = createThinkingMessage(responseTimestamp);
        const responseContainer = thinkingMessageEl.querySelector('.thinking-response-container');
        const thinkingIndicator = thinkingMessageEl.querySelector('.thinking-indicator');
        
        const fullResponse = await generateResponse(message, responseContainer, thinkingIndicator);
        
        // Hide typing indicator
        typingIndicator.style.display = 'none';
        
        // Process the complete response for thinking blocks
        processCompleteResponse(thinkingMessageEl, fullResponse);
        
        scrollToBottom();
        
        conversationHistory.push({
            role: 'assistant',
            content: fullResponse
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

async function generateResponse(userMessage, responseContainer, thinkingIndicator) {
    const host = ollamaHostInput.value.trim() || CONFIG.DEFAULT_HOST;
    const endpoint = `${host}/api/generate`;

    // Build context from sensors
    let sensorContext = '';
    if (userLocation) {
        sensorContext += `[CONTEXT: User location - Latitude: ${userLocation.lat.toFixed(4)}, Longitude: ${userLocation.lng.toFixed(4)}]\n`;
    }
    if (batteryLevel > 0) {
        sensorContext += `[CONTEXT: Device battery - ${batteryLevel}%]\n`;
    }
    sensorContext += `[CONTEXT: Current time - ${new Date().toLocaleString()}]\n`;
    sensorContext += `[CONTEXT: Network status - ${networkStatus}]\n`;

    // Build the prompt context from conversation history
    let prompt = '';
    
    // Add system prompt if available
    if (systemPrompt) {
        prompt += `${systemPrompt}\n\n`;
    }

    // Add sensor context
    if (sensorContext) {
        prompt += sensorContext + '\n';
    }

    // Add conversation history (keep last 10 messages for context)
    const recentHistory = conversationHistory.slice(-10);
    recentHistory.forEach(msg => {
        if (msg.role === 'user') {
            prompt += `User: ${msg.content}\n`;
        } else {
            prompt += `Assistant: ${msg.content}\n`;
        }
    });

    prompt += `User: ${userMessage}\nAssistant:`;

    let fullResponse = '';
    let thinkingContent = '';
    let isInThinking = false;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: CONFIG.MODEL,
                prompt: prompt,
                stream: true,
                temperature: 0.7,
                top_p: 0.9,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Ollama Error ${response.status}:`, errorText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Handle streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            
            // Process all complete lines
            for (let i = 0; i < lines.length - 1; i++) {
                const line = lines[i].trim();
                if (line) {
                    try {
                        const data = JSON.parse(line);
                        if (data.response) {
                            const token = data.response;
                            fullResponse += token;

                            // Check if we're entering or exiting thinking tags
                            if (token.includes('<thinking>')) {
                                isInThinking = true;
                                thinkingContent = '';
                                if (thinkingIndicator) {
                                    thinkingIndicator.style.display = 'flex';
                                }
                            }
                            
                            if (isInThinking) {
                                thinkingContent += token;
                                
                                // Display thinking content in real-time (subtle)
                                const thinkingText = thinkingContent
                                    .replace(/<thinking>/g, '')
                                    .replace(/<\/thinking>/g, '')
                                    .trim();
                                
                                if (thinkingText.length > 0) {
                                    responseContainer.textContent = '💭 ' + thinkingText;
                                    responseContainer.style.opacity = '0.7';
                                    responseContainer.style.fontStyle = 'italic';
                                }
                            }
                            
                            if (token.includes('</thinking>')) {
                                isInThinking = false;
                            }

                            // If we're past thinking, show main response progressively
                            if (!isInThinking && thinkingContent && fullResponse.includes('</thinking>')) {
                                const mainContent = fullResponse.split('</thinking>').pop().trim();
                                if (mainContent.length > 0) {
                                    responseContainer.style.opacity = '1';
                                    responseContainer.style.fontStyle = 'normal';
                                    responseContainer.innerHTML = marked.parse(mainContent);
                                }
                            } else if (!isInThinking && !thinkingContent) {
                                // No thinking block, just show response
                                responseContainer.style.opacity = '1';
                                responseContainer.style.fontStyle = 'normal';
                                responseContainer.innerHTML = marked.parse(fullResponse);
                            }

                            scrollToBottom();
                        }
                    } catch (e) {
                        // Skip invalid JSON lines
                    }
                }
            }
            
            // Keep the last incomplete line in the buffer
            buffer = lines[lines.length - 1];
        }

        // Process any remaining data in the buffer
        if (buffer.trim()) {
            try {
                const data = JSON.parse(buffer);
                if (data.response) {
                    fullResponse += data.response;
                }
            } catch (e) {
                // Skip invalid JSON
            }
        }

        if (!fullResponse) {
            throw new Error('No response from model');
        }

        return fullResponse;
    } catch (error) {
        console.error('Generate response error:', error);
        if (error instanceof TypeError) {
            throw new Error(`Cannot connect to Ollama at ${host}. Make sure Ollama is running and the host is correct.\n\nDetails: ${error.message}`);
        }
        throw error;
    }
}

function addMessage(role, content, timestamp) {
    const messageEl = document.createElement('div');
    messageEl.className = `message ${role}`;

    const contentEl = document.createElement('div');
    contentEl.className = 'message-content';
    
    // Render markdown as HTML for system/assistant messages
    if (role === 'system' || role === 'assistant') {
        contentEl.innerHTML = marked.parse(content);
    } else {
        contentEl.textContent = content;
    }

    const timeEl = document.createElement('div');
    timeEl.className = 'message-time';
    timeEl.textContent = timestamp || getFormattedTime();

    messageEl.appendChild(contentEl);
    messageEl.appendChild(timeEl);

    messagesArea.appendChild(messageEl);
    scrollToBottom();
}

function createThinkingMessage(timestamp) {
    const messageEl = document.createElement('div');
    messageEl.className = 'message thinking';

    // Add thinking indicator
    const thinkingIndicator = document.createElement('div');
    thinkingIndicator.className = 'thinking-indicator';
    thinkingIndicator.innerHTML = '<span class="thinking-pulse"></span> Analyzing...';
    messageEl.appendChild(thinkingIndicator);

    // Create the response container that we'll fill with streamed content
    const responseContainer = document.createElement('div');
    responseContainer.className = 'thinking-response-container';
    messageEl.appendChild(responseContainer);

    // Add timestamp
    const timeEl = document.createElement('div');
    timeEl.className = 'message-time';
    timeEl.textContent = timestamp || getFormattedTime();
    messageEl.appendChild(timeEl);

    messagesArea.appendChild(messageEl);
    scrollToBottom();

    return messageEl;
}

// Parse and extract thinking blocks from response
// Process the final response: format thinking blocks and main content
function processCompleteResponse(messageEl, fullResponse) {
    const responseContainer = messageEl.querySelector('.thinking-response-container');
    const thinkingIndicator = messageEl.querySelector('.thinking-indicator');
    
    // Hide the analyzing indicator
    if (thinkingIndicator) {
        thinkingIndicator.style.display = 'none';
    }
    
    // Parse thinking blocks
    const { blocks: thinkingBlocks, cleanText: finalResponse } = parseThinkingBlocks(fullResponse);
    
    // Clear the container
    responseContainer.innerHTML = '';
    responseContainer.style.opacity = '1';
    responseContainer.style.fontStyle = 'normal';
    responseContainer.style.background = 'transparent';
    responseContainer.style.border = 'none';
    responseContainer.style.borderLeft = 'none';
    responseContainer.style.padding = '0';
    
    // Add thinking blocks if they exist
    if (thinkingBlocks.length > 0) {
        thinkingBlocks.forEach(block => {
            const thinkingBlockEl = createThinkingBlockElement(block.content);
            responseContainer.appendChild(thinkingBlockEl);
        });
    }
    
    // Add separator if there are both thinking blocks and response
    if (thinkingBlocks.length > 0 && finalResponse) {
        const separator = document.createElement('div');
        separator.className = 'response-separator';
        separator.innerHTML = '<div class="response-label">Response</div>';
        responseContainer.appendChild(separator);
    }
    
    // Add the final response (rendered as markdown)
    if (finalResponse) {
        const responseEl = document.createElement('div');
        responseEl.className = 'message-content';
        responseEl.innerHTML = marked.parse(finalResponse);
        responseContainer.appendChild(responseEl);
    }
    
    // Convert from thinking state to system state
    messageEl.classList.remove('thinking');
    messageEl.classList.add('system');
}

function parseThinkingBlocks(text) {
    const thinkingRegex = /<thinking>([\s\S]*?)<\/thinking>/g;
    let match;
    const blocks = [];
    let lastIndex = 0;
    let cleanText = text;

    // Extract all thinking blocks
    while ((match = thinkingRegex.exec(text)) !== null) {
        blocks.push({
            content: match[1].trim(),
            startIndex: match.index,
            endIndex: match.index + match[0].length
        });
    }

    // Remove thinking blocks from the response text
    cleanText = text.replace(/<thinking>[\s\S]*?<\/thinking>/g, '').trim();

    return { blocks, cleanText };
}

// Create a thinking block element
function createThinkingBlockElement(content) {
    const blockEl = document.createElement('div');
    blockEl.className = 'thinking-block';

    const headerEl = document.createElement('div');
    headerEl.className = 'thinking-header';
    headerEl.innerHTML = '<span class="thinking-toggle">▶</span><span class="thinking-label">💭 Thinking Process</span>';
    
    const contentEl = document.createElement('div');
    contentEl.className = 'thinking-content';
    contentEl.innerHTML = marked.parse(content);

    blockEl.appendChild(headerEl);
    blockEl.appendChild(contentEl);

    // Toggle collapsible
    headerEl.addEventListener('click', () => {
        blockEl.classList.toggle('collapsed');
    });
    
    // Start collapsed
    blockEl.classList.add('collapsed');

    return blockEl;
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
