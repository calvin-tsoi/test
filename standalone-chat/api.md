# API.js Documentation - Open WebUI API Client

## Overview

The `api.js` file implements a comprehensive API client for communicating with the Open WebUI backend. It provides a clean interface for authentication, model management, and chat completions while handling multiple API formats and fallback strategies.

## Class Structure

### OpenWebUIAPI Class

The main class that encapsulates all API communication functionality.

## Constructor and Configuration

### Constructor (`lines 2-9`)

```javascript
constructor() {
    this.baseURL = 'http://localhost:8080';  // Base URL for API requests
    this.token = null;                       // Authentication token
    this.modelsLoaded = false;               // Cache flag for models
    this.cachedModels = null;                // Cached models array
}
```

**Key Properties:**
- **`baseURL`**: The base URL for all API requests (defaults to localhost:8080)
- **`token`**: Bearer token for authentication
- **`modelsLoaded`**: Boolean flag to track if models have been loaded
- **`cachedModels`**: Cached models array to avoid repeated API calls

**Design Notes:**
- Uses `localhost` instead of `127.0.0.1` to potentially avoid security dialogs
- Implements caching strategy for models to improve performance
- Separates authentication state from API configuration

## Authentication

### `setToken()` Method (`lines 11-13`)

```javascript
setToken(token) {
    this.token = token;
}
```

**Purpose:** Sets the authentication token for API requests

**Usage:**
```javascript
const api = new OpenWebUIAPI();
api.setToken('your-api-token-here');
```

### `validateToken()` Method (`lines 132-141`)

```javascript
async validateToken() {
    try {
        // Use models endpoint for token validation
        const response = await this.request('/ollama/v1/models');
        return response.ok;
    } catch (error) {
        console.error('Token validation error:', error);
        return false;
    }
}
```

**Purpose:** Validates if the current token is valid and has appropriate permissions

**Returns:** `boolean` - `true` if token is valid, `false` otherwise

**Implementation Details:**
- Uses the models endpoint as a lightweight validation method
- Returns `false` on any error (network, authentication, etc.)
- Provides console logging for debugging purposes

## Core HTTP Client

### `request()` Method (`lines 15-37`)

The core HTTP client that handles all API communication:

```javascript
async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
        ...options,
        headers
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || `HTTP ${response.status}`);
    }

    return response;
}
```

**Parameters:**
- **`endpoint`**: API endpoint path (e.g., '/ollama/v1/models')
- **`options`**: Fetch options object (method, body, headers, etc.)

**Returns:** `Response` object if successful

**Features:**
- **Automatic URL Construction**: Combines base URL with endpoint
- **Default Headers**: Sets JSON content type by default
- **Token Injection**: Automatically adds Bearer token if available
- **Error Handling**: Throws descriptive errors for failed requests
- **Flexible Options**: Allows overriding any fetch options

**Usage Examples:**
```javascript
// GET request
const response = await api.request('/ollama/v1/models');

// POST request
const response = await api.request('/ollama/v1/chat/completions', {
    method: 'POST',
    body: JSON.stringify({ model: 'llama2', messages: [...] })
});
```

## Model Management

### `getModels()` Method (`lines 39-88`)

Fetches available AI models with intelligent fallback strategy:

```javascript
async getModels() {
    try {
        // Return cached models if available
        if (this.modelsLoaded && this.cachedModels) {
            return this.cachedModels;
        }

        let response;
        let data;
        
        try {
            // Primary: Try Ollama v1 models endpoint
            response = await this.request('/ollama/v1/models');
            data = await response.json();
            
            if (data.data && Array.isArray(data.data)) {
                this.cachedModels = data.data.map(model => ({
                    id: model.id,
                    name: model.id || model.name
                }));
            } else {
                throw new Error('Invalid Ollama response format');
            }
        } catch (ollamaError) {
            // Fallback: Try OpenAI models endpoint
            console.warn('Ollama models failed, trying OpenAI:', ollamaError);
            
            response = await this.request('/openai/models');
            data = await response.json();
            
            if (data.data && Array.isArray(data.data)) {
                this.cachedModels = data.data.map(model => ({
                    id: model.id,
                    name: model.id || model.name
                }));
            } else {
                throw new Error('Invalid OpenAI response format');
            }
        }
        
        this.modelsLoaded = true;
        return this.cachedModels;
        
    } catch (error) {
        console.error('Error fetching models:', error);
        return [];
    }
}
```

**Returns:** `Array<Object>` - Array of model objects with `id` and `name` properties

**Key Features:**

#### 1. **Caching Strategy** (`lines 41-43`)
- Checks if models are already loaded
- Returns cached results to avoid repeated API calls
- Improves performance and reduces server load

#### 2. **Dual API Support** (`lines 49-79`)
- **Primary**: Ollama v1 API (`/ollama/v1/models`)
- **Fallback**: OpenAI API (`/openai/models`)
- Seamless transition between different backend configurations

#### 3. **Response Normalization** (`lines 55-59`, `71-75`)
```javascript
this.cachedModels = data.data.map(model => ({
    id: model.id,
    name: model.id || model.name
}));
```
- Normalizes different API response formats
- Ensures consistent model object structure
- Handles cases where `name` field might be missing

#### 4. **Error Resilience** (`lines 84-87`)
- Returns empty array on complete failure
- Prevents application crashes from API issues
- Provides comprehensive error logging

**Usage Example:**
```javascript
const models = await api.getModels();
console.log(models);
// Output: [
//   { id: 'llama2:7b', name: 'llama2:7b' },
//   { id: 'codellama:13b', name: 'codellama:13b' }
// ]
```

## Chat Completion

### `chatCompletion()` Method (`lines 90-130`)

Handles AI chat completion requests with support for different response formats:

```javascript
async chatCompletion(messages, model, onChunk) {
    const body = {
        model: model,
        messages: messages,
        stream: false
    };

    try {
        const response = await this.request('/ollama/v1/chat/completions', {
            method: 'POST',
            body: JSON.stringify(body)
        });

        const data = await response.json();

        // Handle OpenAI format response
        if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
            const content = data.choices[0].message.content;
            onChunk(content);
            return;
        }

        // Handle Ollama native format response (fallback)
        if (data.message && data.message.content) {
            const content = data.message.content;
            onChunk(content);
            return;
        }

        throw new Error('No response content found');

    } catch (error) {
        console.error('Chat completion error:', error);
        throw error;
    }
}
```

**Parameters:**
- **`messages`**: Array of conversation messages in OpenAI format
- **`model`**: Model ID to use for completion
- **`onChunk`**: Callback function to handle response content

**Message Format:**
```javascript
const messages = [
    { role: 'user', content: 'Hello, how are you?' },
    { role: 'assistant', content: 'I am doing well, thank you!' },
    { role: 'user', content: 'What can you help me with?' }
];
```

**Key Features:**

#### 1. **Request Body Construction** (`lines 91-95`)
```javascript
const body = {
    model: model,          // Model identifier
    messages: messages,    // Conversation history
    stream: false         // Disable streaming for simplicity
};
```
- Uses OpenAI-compatible format
- Disables streaming for simpler implementation
- Could be extended to support streaming in the future

#### 2. **Dual Response Format Support** (`lines 110-121`)

**OpenAI Format** (`lines 110-114`):
```javascript
// Expected structure:
{
    "choices": [{
        "message": {
            "content": "Response text here..."
        }
    }]
}
```

**Ollama Native Format** (`lines 117-121`):
```javascript
// Expected structure:
{
    "message": {
        "content": "Response text here..."
    }
}
```

#### 3. **Callback-based Response Handling** (`lines 112`, `119`)
- Uses callback pattern for response delivery
- Enables future streaming implementation
- Provides consistent interface regardless of response format

#### 4. **Comprehensive Error Handling** (`lines 123-129`)
- Validates response structure before processing
- Provides detailed error messages
- Re-throws errors for upstream handling

**Usage Example:**
```javascript
const messages = [
    { role: 'user', content: 'Explain quantum computing' }
];

await api.chatCompletion(messages, 'llama2:7b', (content) => {
    console.log('AI Response:', content);
    // Update UI with the response
});
```

## API Endpoints Reference

### Available Endpoints

1. **`/ollama/v1/models`** - Primary models endpoint
   - **Method**: GET
   - **Purpose**: Fetch available Ollama models
   - **Response**: OpenAI-compatible models list

2. **`/openai/models`** - Fallback models endpoint
   - **Method**: GET
   - **Purpose**: Fetch models via OpenAI API compatibility
   - **Response**: OpenAI models list format

3. **`/ollama/v1/chat/completions`** - Chat completion endpoint
   - **Method**: POST
   - **Purpose**: Generate AI responses
   - **Body**: OpenAI-compatible chat completion request

### Response Formats

#### Models Response Format
```javascript
{
    "data": [
        {
            "id": "llama2:7b",
            "name": "Llama 2 7B",
            // ... other model properties
        }
    ]
}
```

#### Chat Completion Response Formats

**OpenAI Format:**
```javascript
{
    "choices": [
        {
            "message": {
                "role": "assistant",
                "content": "Your response here..."
            }
        }
    ]
}
```

**Ollama Native Format:**
```javascript
{
    "message": {
        "role": "assistant", 
        "content": "Your response here..."
    }
}
```

## Error Handling Strategy

### Layered Error Handling

1. **Network Level** - HTTP errors, connection issues
2. **Authentication Level** - Invalid tokens, permission errors
3. **API Level** - Invalid responses, missing data
4. **Application Level** - Graceful degradation

### Error Types and Responses

#### Authentication Errors
```javascript
// Invalid token
throw new Error('HTTP 401'); 

// Token validation returns false
return false;
```

#### Network Errors
```javascript
// Connection failed
throw new Error('Failed to fetch');

// Server error
throw new Error('HTTP 500');
```

#### Data Validation Errors
```javascript
// Invalid response format
throw new Error('Invalid Ollama response format');

// Missing content
throw new Error('No response content found');
```

## Performance Optimizations

### 1. **Model Caching**
- Caches models after first successful load
- Reduces API calls and improves response time
- Invalidated only when necessary

### 2. **Efficient Error Handling**
- Fails fast on invalid responses
- Provides detailed logging for debugging
- Avoids unnecessary processing

### 3. **Flexible Architecture**
- Supports multiple API formats without code duplication
- Easy to extend for new endpoints or formats
- Minimal overhead for API compatibility

## Future Enhancement Opportunities

### 1. **Streaming Support**
```javascript
// Potential streaming implementation
async chatCompletionStream(messages, model, onChunk) {
    const body = {
        model: model,
        messages: messages,
        stream: true  // Enable streaming
    };
    
    const response = await this.request('/ollama/v1/chat/completions', {
        method: 'POST',
        body: JSON.stringify(body)
    });
    
    const reader = response.body.getReader();
    // Process streaming chunks...
}
```

### 2. **Request Caching**
```javascript
// Cache frequently used responses
this.responseCache = new Map();

async cachedRequest(endpoint, options, ttl = 300000) {
    const cacheKey = `${endpoint}:${JSON.stringify(options)}`;
    // Implement caching logic...
}
```

### 3. **Retry Logic**
```javascript
async requestWithRetry(endpoint, options, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await this.request(endpoint, options);
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
        }
    }
}
```

### 4. **Configuration Management**
```javascript
constructor(config = {}) {
    this.baseURL = config.baseURL || 'http://localhost:8080';
    this.timeout = config.timeout || 30000;
    this.retries = config.retries || 3;
    // ... other configurable options
}
```

## Usage Examples

### Complete Integration Example

```javascript
// Initialize API client
const api = new OpenWebUIAPI();

// Set authentication token
api.setToken('your-api-token');

// Validate token
const isValid = await api.validateToken();
if (!isValid) {
    console.error('Invalid API token');
    return;
}

// Load available models
const models = await api.getModels();
console.log('Available models:', models);

// Start a conversation
const messages = [
    { role: 'user', content: 'Hello! Can you help me with JavaScript?' }
];

await api.chatCompletion(messages, models[0].id, (response) => {
    console.log('AI:', response);
    // Update your UI with the response
});
```

### Error Handling Example

```javascript
try {
    const models = await api.getModels();
    if (models.length === 0) {
        console.warn('No models available');
        return;
    }
    
    await api.chatCompletion(messages, models[0].id, handleResponse);
} catch (error) {
    if (error.message.includes('401')) {
        console.error('Authentication failed - check your token');
    } else if (error.message.includes('Network')) {
        console.error('Network error - check your connection');
    } else {
        console.error('Unexpected error:', error.message);
    }
}
```

## Architecture Benefits

### 1. **Separation of Concerns**
- Clean separation between API logic and UI logic
- Reusable across different interfaces
- Easy to test and maintain

### 2. **Flexibility**
- Supports multiple API formats
- Easy to extend for new endpoints
- Configuration-driven behavior

### 3. **Reliability**
- Comprehensive error handling
- Graceful fallback strategies
- Robust caching mechanisms

### 4. **Performance**
- Efficient caching reduces API calls
- Minimal overhead for compatibility
- Fast token validation

This API client provides a solid foundation for communicating with Open WebUI backends while maintaining flexibility and reliability across different deployment scenarios.
