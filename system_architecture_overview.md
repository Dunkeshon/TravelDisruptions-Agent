# Wayra Travel Companion - System Architecture Overview

This document explains how the Wayra Travel Companion web application processes user messages, manages live context through device sensors, and communicates with external APIs.

## 1. Sensor Data Collection

The application actively monitors the user's device and physical environment to build a real-time `liveContext` object. The following data is collected:

1.  **Geolocation (`navigator.geolocation`)**:
    *   **Data**: Latitude, Longitude, and Accuracy.
    *   **Trigger**: Fetched once upon initialization (`DOMContentLoaded` -> `initializeSensors()`).
2.  **Weather Data (Open-Meteo API)**:
    *   **Data**: Temperature (°C), Humidity (%), Weather condition (e.g., "Clear sky", "Heavy rain"), and Wind speed (km/h).
    *   **Trigger**: Fetched immediately after the geolocation is successfully acquired, and then polled every 10 minutes.
3.  **Battery Status (`navigator.getBattery()`)**:
    *   **Data**: Battery percentage (0-100%).
    *   **Trigger**: Fetched on initialization and updated continuously via the `levelchange` event listener.
4.  **Network Status (`navigator.onLine`)**:
    *   **Data**: Connectivity state (`'online'` or `'offline'`).
    *   **Trigger**: Fetched on initialization and updated continuously via `online`/`offline` window events.
5.  **Time**:
    *   **Data**: Current local time.
    *   **Trigger**: Updated dynamically when a message is sent.

## 2. API Call Execution Flow

API calls are triggered at specific points in the application lifecycle.

### A. Open-Meteo Weather API
Called automatically by the system in the background. It is entirely transparent to the user.
*   **Initial Call**: Inside `initializeSensors()`, immediately after the browser successfully returns the user's GPS coordinates.
*   **Polling**: Controlled by a `setInterval` function that runs every 10 minutes (600,000 ms). It only fires if the device is online and location is known.

### B. Ollama LLM API (Local AI)
Triggered explicitly when the user clicks the "Send" button or presses "Enter" (`sendMessage()`). The message undergoes a **Two-Stage Routing System**:

*   **Stage 1: Core Router** (`callRouter()`)
    *   Sends a non-streaming POST request (`/api/generate`) with a lightweight prompt to classify the user's message into a category (e.g., `RUMI`, `TIKA`, `CHASKA`, `AYNI`, or `GENERAL`).
*   **Stage 2: Specialist Execution** (`callSpecialist()`)
    *   Sends a streaming POST request (`/api/generate`) to generate the final response. It combines the specific agent's instruction prompt with the real-time sensor context.

---

## 3. Prompt Concatenation Snippets

When the Specialist agent is invoked, the application constructs the final prompt string by concatenating the system instructions, the live sensor data, the trip memory, and the user's message.

Here is the exact code snippet from `app.js` (lines 668-714) showing how the final prompt is built:

```javascript
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
    
    // Add minimal context block
    prompt += '═══════════════════════════════════════════════════════════════\n';
    prompt += 'CONTEXT\n';
    prompt += '═══════════════════════════════════════════════════════════════\n\n';
    
    // 1. Inject Geolocation
    if (liveContext.location) {
        prompt += `Location: ${liveContext.location.lat.toFixed(4)}, ${liveContext.location.lng.toFixed(4)}\n`;
    }
    
    // 2. Inject Weather Data
    if (liveContext.weather) {
        const weather = liveContext.weather;
        const weatherDesc = getWeatherDescription(weather.weatherCode);
        prompt += `Weather: ${weather.temperature}°C, ${weatherDesc}, humidity ${weather.humidity}%, wind ${weather.windSpeed} km/h\n`;
    }
    
    // 3. Inject Time and Network
    prompt += `Time: ${liveContext.time.toLocaleString()}\n`;
    prompt += `Connectivity: ${liveContext.connectivity}\n\n`;
    
    // 4. Inject Trip Memory (Destinations & Budget)
    if (tripMemory.destinations.length > 0) {
        prompt += `Trip Destinations: ${tripMemory.destinations.map(d => d.name).join(' → ')}\n`;
    }
    if (tripMemory.budget.remaining_eur > 0) {
        prompt += `Budget: €${tripMemory.budget.remaining_eur} remaining\n`;
    }
    
    // 5. Inject Conversation History (Last 2 messages)
    const recentMsgs = conversationHistory.slice(-2);
    if (recentMsgs.length > 0) {
        prompt += '\nRecent Messages:\n';
        recentMsgs.forEach(msg => {
            prompt += `${msg.role}: ${msg.content.substring(0, 100)}\n`;
        });
    }
    
    // 6. Inject the Final User Query
    prompt += `\nUser: ${userMessage}`;
```

*(Note: There is also a legacy fallback `generateResponse()` function that formats the sensor data slightly differently using square brackets (e.g., `[CONTEXT: Device battery - 12%]`), but the primary execution path relies on the structure shown above).*
