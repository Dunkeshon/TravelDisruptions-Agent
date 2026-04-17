// Configuration
const CONFIG = {
    DEFAULT_HOST: 'http://localhost:11434',
    MODEL: 'gemma4:e4b',
    SYSTEM_PROMPT_FILE: './prompts/systemprompt.txt'
};

// State
let conversationHistory = [];
let systemPrompt = '';
let routerPrompt = '';
let specialistPrompts = {};
let isLoading = false;
let userLocation = null;
let batteryLevel = 0;
let networkStatus = 'online';

// Trip Memory State
let tripMemory = {
    trip_id: Date.now().toString(),
    destinations: [],
    budget: { remaining_eur: 0, daily_burn: 0, learned_preferences: [] },
    preferences: { transport_mode: 'any', accommodation_type: 'hostel', risk_tolerance: 'moderate' },
    decisions: []
};

// Live Context State
let liveContext = {
    location: null,
    time: new Date(),
    weather: null,
    connectivity: navigator.onLine ? 'online' : 'offline'
};

// Weather API Config (Open-Meteo - free, no API key needed)
const WEATHER_API = 'https://api-meteo.open-meteo.com/v1/forecast';

// DOM Elements
const messagesArea = document.getElementById('messagesArea');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const typingIndicator = document.getElementById('typingIndicator');
const ollamaHostInput = document.getElementById('ollamaHost');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadConfiguration();
    loadSystemPrompts();
    loadTripMemory();
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

async function loadSystemPrompts() {
    try {
        // Load main system prompt
        const systemResponse = await fetch(CONFIG.SYSTEM_PROMPT_FILE);
        if (systemResponse.ok) {
            systemPrompt = await systemResponse.text();
            console.log('✓ System prompt loaded');
        }
        
        // Load router prompt
        const routerResponse = await fetch('./prompts/router-prompt.txt');
        if (routerResponse.ok) {
            routerPrompt = await routerResponse.text();
            console.log('✓ Router prompt loaded');
        }
        
        // Load specialist prompts
        const specialists = ['Pre-Prompt.txt', 'Tika.txt', 'rumi.txt', 'Chaska.txt', 'ayni.txt'];
        for (const spec of specialists) {
            const response = await fetch('./prompts/' + spec);
            if (response.ok) {
                specialistPrompts[spec.replace('.txt', '')] = await response.text();
                console.log(`✓ ${spec} loaded`);
            }
        }
    } catch (error) {
        console.warn('Could not load all prompts:', error);
    }
}

function loadTripMemory() {
    const saved = localStorage.getItem('tripMemory');
    if (saved) {
        tripMemory = JSON.parse(saved);
        console.log('✓ Trip memory loaded:', tripMemory);
    }
}

function saveTripMemory() {
    localStorage.setItem('tripMemory', JSON.stringify(tripMemory));
}

// Fetch real weather data from Open-Meteo API (free, no API key)
async function fetchWeatherData() {
    if (!liveContext.location || liveContext.connectivity === 'offline') {
        console.log('Weather: Location unavailable or offline');
        return null;
    }

    try {
        const { lat, lng } = liveContext.location;
        const url = `${WEATHER_API}?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`;
        
        const response = await fetch(url);
        if (!response.ok) return null;
        
        const data = await response.json();
        const current = data.current;
        
        liveContext.weather = {
            temperature: current.temperature_2m,
            humidity: current.relative_humidity_2m,
            weatherCode: current.weather_code,
            windSpeed: current.wind_speed_10m,
            timezone: data.timezone,
            timestamp: new Date().toISOString()
        };
        
        console.log('✓ Weather fetched:', liveContext.weather);
        return liveContext.weather;
    } catch (error) {
        console.warn('Could not fetch weather:', error);
        return null;
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
    // Update live context
    liveContext.time = new Date();
    liveContext.location = userLocation;
    liveContext.connectivity = navigator.onLine ? 'online' : 'offline';
    
    // Request geolocation
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy
                };
                liveContext.location = userLocation;
                console.log('Location acquired:', userLocation);
                
                // Fetch weather for this location
                fetchWeatherData();
                
                updateHeaderStatus();
            },
            (error) => {
                console.log('Location access denied or unavailable:', error.message);
                updateHeaderStatus();
            },
            { timeout: 10000, maximumAge: 300000 }
        );
    }
    
    // Refresh weather every 10 minutes if connected
    setInterval(() => {
        if (liveContext.connectivity === 'online' && liveContext.location) {
            fetchWeatherData();
        }
    }, 600000);

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

// Convert WMO weather code to readable description
function getWeatherDescription(code) {
    const weatherCodes = {
        0: 'Clear sky',
        1: 'Mainly clear',
        2: 'Partly cloudy',
        3: 'Overcast',
        45: 'Foggy',
        48: 'Frosted fog',
        51: 'Light drizzle',
        53: 'Moderate drizzle',
        55: 'Dense drizzle',
        61: 'Slight rain',
        63: 'Moderate rain',
        65: 'Heavy rain',
        71: 'Slight snow',
        73: 'Moderate snow',
        75: 'Heavy snow',
        77: 'Snow grains',
        80: 'Slight rain showers',
        81: 'Moderate rain showers',
        82: 'Violent rain showers',
        85: 'Slight snow showers',
        86: 'Heavy snow showers',
        95: 'Thunderstorm',
        96: 'Thunderstorm with hail',
        99: 'Thunderstorm with heavy hail'
    };
    return weatherCodes[code] || 'Unknown weather';
}

async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message || isLoading) return;

    saveConfiguration();
    
    // Update live context
    liveContext.time = new Date();
    liveContext.connectivity = navigator.onLine ? 'online' : 'offline';

    // Add user message to UI
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
        // STAGE 1: Call the Core Router
        console.log('🔄 [Stage 1] Routing message...');
        const routingDecision = await callRouter(message);
        
        if (!routingDecision) {
            throw new Error('Router failed to process message');
        }
        
        console.log('📊 Routing decision:', routingDecision);
        
        // Check confidence
        if (routingDecision.confidence === 'LOW') {
            typingIndicator.style.display = 'none';
            const clarifyTimestamp = new Date().toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
            });
            addMessage('system', `I'm not quite sure. Can you tell me more? (${routingDecision.reason})`, clarifyTimestamp);
            isLoading = false;
            return;
        }
        
        // STAGE 2: Call the appropriate specialist
        const agent = routingDecision.routing_agent || routingDecision.agent;
        console.log(`🎯 [Stage 2] Invoking specialist: ${agent}`);
        
        const responseTimestamp = new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
        
        const thinkingMessageEl = createThinkingMessage(responseTimestamp);
        const responseContainer = thinkingMessageEl.querySelector('.thinking-response-container');
        const thinkingIndicator = thinkingMessageEl.querySelector('.thinking-indicator');
        
        const fullResponse = await callSpecialist(
            agent,
            message,
            responseContainer,
            thinkingIndicator
        );
        
        // Hide typing indicator
        typingIndicator.style.display = 'none';
        
        // Process the complete response
        processCompleteResponse(thinkingMessageEl, fullResponse);
        scrollToBottom();
        
        conversationHistory.push({
            role: 'assistant',
            content: fullResponse
        });
        
        // Save trip memory after successful specialist response
        saveTripMemory();
        
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

// STAGE 1: Core Router Agent (Lightweight)
async function callRouter(userMessage) {
    const host = ollamaHostInput.value.trim() || CONFIG.DEFAULT_HOST;
    const endpoint = `${host}/api/generate`;

    // MINIMAL router prompt - just the essential rules
    let prompt = `You are a routing agent. Classify this user message and return ONLY valid JSON.

Rules:
- RUMI: transport/bus/train/taxi/ride cancelled, missed, delayed, stranded
- TIKA: no place to stay, booking failed, accommodation, hostel search  
- CHASKA: area/route safe?, danger, risk, safety concern
- AYNI: border, visa, customs, passport, documents, crossing
- GENERAL: planning, advice, other

Return exactly:
{"agent":"RUMI|TIKA|CHASKA|AYNI|GENERAL","confidence":"HIGH|MEDIUM|LOW","reason":"one sentence"}

Message: "${userMessage}"
JSON:`;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: CONFIG.MODEL,
                prompt: prompt,
                stream: false,
                temperature: 0.2,
                top_p: 0.95,
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('Router HTTP error:', errText);
            return null;
        }

        const result = await response.json();
        const responseText = result.response.trim();
        
        // Extract JSON from response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.warn('Could not extract JSON:', responseText);
            // Fallback routing based on keywords
            if (userMessage.toLowerCase().includes('train') || userMessage.toLowerCase().includes('bus') || userMessage.toLowerCase().includes('taxi')) {
                return { agent: 'RUMI', confidence: 'MEDIUM', reason: 'Transport keyword detected' };
            }
            if (userMessage.toLowerCase().includes('stay') || userMessage.toLowerCase().includes('hostel') || userMessage.toLowerCase().includes('hotel')) {
                return { agent: 'TIKA', confidence: 'MEDIUM', reason: 'Accommodation keyword detected' };
            }
            if (userMessage.toLowerCase().includes('safe') || userMessage.toLowerCase().includes('danger')) {
                return { agent: 'CHASKA', confidence: 'MEDIUM', reason: 'Safety keyword detected' };
            }
            return { agent: 'GENERAL', confidence: 'MEDIUM', reason: 'Default routing' };
        }
        
        const routing = JSON.parse(jsonMatch[0]);
        routing.routing_agent = routing.agent; // Map to our naming convention
        routing.trip_update = null; // No trip update in simple routing
        return routing;
    } catch (error) {
        console.error('Router call failed:', error);
        return { agent: 'GENERAL', confidence: 'LOW', reason: 'Router error - defaulting to general' };
    }
}

// STAGE 2: Specialist Agent Execution (Optimized)
async function callSpecialist(agentName, userMessage, responseContainer, thinkingIndicator) {
    const host = ollamaHostInput.value.trim() || CONFIG.DEFAULT_HOST;
    const endpoint = `${host}/api/generate`;

    // Map agent name to specialist prompt
    const agentMap = {
        'TIKA': 'Tika',
        'RUMI': 'rumi',
        'CHASKA': 'Chaska',
        'AYNI': 'ayni',
        'GENERAL': 'Pre-Prompt'
    };
    
    const specName = agentMap[agentName] || 'Pre-Prompt';
    const specialistPrompt = specialistPrompts[specName] || '';

    // Build minimal specialist prompt
    let prompt = '';
    
    // Add Pre-Prompt (shared identity)
    if (specialistPrompts['Pre-Prompt']) {
        prompt += specialistPrompts['Pre-Prompt'] + '\n\n';
    }
    
    // Add specialist-specific prompt if not GENERAL
    if (agentName !== 'GENERAL' && specialistPrompts[specName]) {
        prompt += specialistPrompts[specName] + '\n\n';
    }
    
    // Add minimal context
    prompt += '═══════════════════════════════════════════════════════════════\n';
    prompt += 'CONTEXT\n';
    prompt += '═══════════════════════════════════════════════════════════════\n\n';
    
    if (liveContext.location) {
        prompt += `Location: ${liveContext.location.lat.toFixed(4)}, ${liveContext.location.lng.toFixed(4)}\n`;
    }
    
    if (liveContext.weather) {
        const weather = liveContext.weather;
        const weatherDesc = getWeatherDescription(weather.weatherCode);
        prompt += `Weather: ${weather.temperature}°C, ${weatherDesc}, humidity ${weather.humidity}%, wind ${weather.windSpeed} km/h\n`;
    }
    
    prompt += `Time: ${liveContext.time.toLocaleString()}\n`;
    prompt += `Connectivity: ${liveContext.connectivity}\n\n`;
    
    if (tripMemory.destinations.length > 0) {
        prompt += `Trip Destinations: ${tripMemory.destinations.map(d => d.name).join(' → ')}\n`;
    }
    if (tripMemory.budget.remaining_eur > 0) {
        prompt += `Budget: €${tripMemory.budget.remaining_eur} remaining\n`;
    }
    
    // Last 2 messages only
    const recentMsgs = conversationHistory.slice(-2);
    if (recentMsgs.length > 0) {
        prompt += '\nRecent Messages:\n';
        recentMsgs.forEach(msg => {
            prompt += `${msg.role}: ${msg.content.substring(0, 100)}\n`;
        });
    }
    
    prompt += `\nUser: ${userMessage}`;

    let fullResponse = '';
    let thinkingContent = '';
    let isInThinking = false;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: CONFIG.MODEL,
                prompt: prompt,
                stream: true,
                temperature: 0.7,
                top_p: 0.9,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        // Stream response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            
            for (let i = 0; i < lines.length - 1; i++) {
                const line = lines[i].trim();
                if (line) {
                    try {
                        const data = JSON.parse(line);
                        if (data.response) {
                            const token = data.response;
                            fullResponse += token;

                            if (token.includes('<thinking>')) {
                                isInThinking = true;
                                thinkingContent = '';
                                if (thinkingIndicator) {
                                    thinkingIndicator.style.display = 'flex';
                                }
                            }
                            
                            if (isInThinking) {
                                thinkingContent += token;
                                const thinkingText = thinkingContent
                                    .replace(/<thinking>/g, '')
                                    .replace(/<\/thinking>/g, '')
                                    .trim();
                                
                                if (thinkingText.length > 0) {
                                    responseContainer.textContent = '💭 ' + thinkingText.substring(0, 150);
                                    responseContainer.style.opacity = '0.7';
                                    responseContainer.style.fontStyle = 'italic';
                                }
                            }
                            
                            if (token.includes('</thinking>')) {
                                isInThinking = false;
                            }

                            if (!isInThinking && thinkingContent && fullResponse.includes('</thinking>')) {
                                const mainContent = fullResponse.split('</thinking>').pop().trim();
                                if (mainContent.length > 0) {
                                    responseContainer.style.opacity = '1';
                                    responseContainer.style.fontStyle = 'normal';
                                    if (typeof marked !== 'undefined') {
                                        responseContainer.innerHTML = marked.parse(mainContent);
                                    } else {
                                        responseContainer.textContent = mainContent;
                                    }
                                }
                            } else if (!isInThinking && !thinkingContent) {
                                responseContainer.style.opacity = '1';
                                responseContainer.style.fontStyle = 'normal';
                                if (typeof marked !== 'undefined') {
                                    responseContainer.innerHTML = marked.parse(fullResponse);
                                } else {
                                    responseContainer.textContent = fullResponse;
                                }
                            }

                            scrollToBottom();
                        }
                    } catch (e) {
                        // Skip invalid JSON
                    }
                }
            }
            
            buffer = lines[lines.length - 1];
        }

        if (buffer.trim()) {
            try {
                const data = JSON.parse(buffer);
                if (data.response) {
                    fullResponse += data.response;
                }
            } catch (e) {}
        }

        if (!fullResponse) {
            throw new Error('No response from specialist');
        }

        return fullResponse;
    } catch (error) {
        console.error('Specialist call failed:', error);
        throw error;
    }
}

// Trip Memory Management
function updateTripMemoryFromRouter(update) {
    if (!update) return;
    
    if (update.revised_destination) {
        tripMemory.destinations = tripMemory.destinations.filter(d => d.status !== 'current');
        tripMemory.destinations.push({
            name: update.revised_destination,
            eta: new Date().toISOString(),
            status: 'current'
        });
    }
    
    if (update.eta_pressure) {
        console.log(`⚠️ Time pressure: ${update.eta_pressure}`);
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
