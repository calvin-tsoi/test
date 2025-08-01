// API client for Open WebUI
class OpenWebUIAPI {
    constructor() {
        // Change from 127.0.0.1 to localhost
        this.baseURL = 'http://localhost:8080';  // This might avoid the security dialog
        this.token = null;
        this.modelsLoaded = false;
        this.cachedModels = null;
    }

    setToken(token) {
        this.token = token;
    }

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

    async getModels() {
        try {
            if (this.modelsLoaded && this.cachedModels) {
                return this.cachedModels;
            }

            // Use the correct models endpoint - try Ollama first, then OpenAI
            let response;
            let data;
            
            try {
                // Try Ollama v1 models endpoint
                response = await this.request('/ollama/v1/models');
                data = await response.json();
                console.log('Ollama models response:', data);
                
                if (data.data && Array.isArray(data.data)) {
                    this.cachedModels = data.data.map(model => ({
                        id: model.id,
                        name: model.id || model.name
                    }));
                } else {
                    throw new Error('Invalid Ollama response format');
                }
            } catch (ollamaError) {
                console.warn('Ollama models failed, trying OpenAI:', ollamaError);
                
                // Fallback to OpenAI models endpoint
                response = await this.request('/openai/models');
                data = await response.json();
                console.log('OpenAI models response:', data);
                
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

    async chatCompletion(messages, model, onChunk) {
        const body = {
            model: model,
            messages: messages,
            stream: false
        };

        try {
            console.log('Making chat request to:', '/ollama/v1/chat/completions');
            console.log('Request body:', body);
            
            const response = await this.request('/ollama/v1/chat/completions', {
                method: 'POST',
                body: JSON.stringify(body)
            });

            const data = await response.json();
            console.log('Chat response:', data);

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

            console.error('Unexpected response format:', data);
            throw new Error('No response content found');

        } catch (error) {
            console.error('Chat completion error:', error);
            throw error;
        }
    }

    async validateToken() {
        try {
            // Use a reliable endpoint for token validation
            const response = await this.request('/ollama/v1/models');
            return response.ok;
        } catch (error) {
            console.error('Token validation error:', error);
            return false;
        }
    }
}
