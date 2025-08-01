// Main application logic
class ChatApp {
    constructor() {
        this.db = new ChatDB();
        this.api = new OpenWebUIAPI();
        this.currentChatId = null;
        this.models = [];
        this.currentModel = null;
        this.isInitialized = false;
        this.isSending = false; // Add flag to prevent multiple sends
        
        this.init();
    }

    async init() {
        try {
            // Wait for DOM to be ready
            if (document.readyState !== 'complete') {
                await new Promise(resolve => {
                    window.addEventListener('load', resolve);
                });
            }

            this.initializeElements();
            this.setupEventHandlers();
            
            await this.db.init();
            await this.loadSavedToken();
            await this.loadChats();
            this.showEmptyState();
            
            this.isInitialized = true;
            console.log('ChatApp initialized successfully');
        } catch (error) {
            console.error('Initialization error:', error);
        }
    }

    initializeElements() {
        this.tokenInput = document.getElementById('token-input');
        this.saveTokenBtn = document.getElementById('save-token-btn');
        this.tokenStatus = document.getElementById('token-status');
        this.newChatBtn = document.getElementById('new-chat-btn');
        this.chatList = document.getElementById('chat-list');
        this.messagesContainer = document.getElementById('messages-container');
        this.messageInput = document.getElementById('message-input');
        this.sendBtn = document.getElementById('send-btn');
        this.modelSelect = document.getElementById('model-select');
        
        // Ensure all elements exist
        if (!this.sendBtn || !this.messageInput) {
            throw new Error('Required DOM elements not found');
        }
    }

    setupEventHandlers() {
        // Prevent all form submissions globally
        document.addEventListener('submit', (e) => {
            console.log('Form submission prevented');
            e.preventDefault();
            e.stopPropagation();
            return false;
        });

        // Prevent Enter key from causing any unwanted behavior
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target !== this.messageInput) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        });

        // Token handling - ensure no form submission
        this.saveTokenBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.saveToken();
            return false;
        });

        // Chat handling - ensure no form submission
        this.newChatBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.createNewChat();
            return false;
        });

        // Send button - prevent any form submission
        this.sendBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            if (!this.isSending) {
                this.handleSendMessage();
            }
            return false;
        });

        // Message input handling - only allow Enter for send, prevent form submission
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                
                if (!e.shiftKey && !this.isSending) {
                    this.handleSendMessage();
                } else if (e.shiftKey) {
                    // Allow Shift+Enter for new line
                    const start = this.messageInput.selectionStart;
                    const end = this.messageInput.selectionEnd;
                    this.messageInput.value = this.messageInput.value.substring(0, start) + '\n' + this.messageInput.value.substring(end);
                    this.messageInput.selectionStart = this.messageInput.selectionEnd = start + 1;
                    this.adjustTextareaHeight();
                }
                return false;
            }
        });

        this.messageInput.addEventListener('input', () => {
            this.adjustTextareaHeight();
            this.updateSendButtonState();
        });

        // Model selection
        this.modelSelect.addEventListener('change', (e) => {
            this.currentModel = e.target.value;
            this.db.saveSetting('selectedModel', this.currentModel);
            this.updateSendButtonState();
            console.log('Model changed to:', this.currentModel);
        });

        // Prevent any accidental navigation
        window.addEventListener('beforeunload', (e) => {
            if (this.isSending) {
                e.preventDefault();
                e.returnValue = 'A message is being sent. Are you sure you want to leave?';
                return e.returnValue;
            }
        });
    }

    async handleSendMessage() {
        if (!this.isInitialized || this.isSending) {
            console.log('Cannot send: app not ready or already sending');
            return false;
        }

        try {
            this.isSending = true;
            this.updateSendButtonState();
            
            await this.sendMessage();
        } catch (error) {
            console.error('Send message error:', error);
        } finally {
            this.isSending = false;
            this.updateSendButtonState();
        }

        return false;
    }

    async sendMessage() {
        try {
            const content = this.messageInput.value.trim();
            if (!content || !this.currentModel || !this.currentChatId) {
                console.log('Cannot send: missing requirements', {
                    content: !!content,
                    model: !!this.currentModel, 
                    chat: !!this.currentChatId
                });
                return false;
            }

            console.log('Sending message:', content);

            // Clear input immediately
            this.messageInput.value = '';
            this.adjustTextareaHeight();
            this.updateSendButtonState();

            // Add user message
            const userMessage = {
                id: this.generateId(),
                chatId: this.currentChatId,
                role: 'user',
                content: content,
                timestamp: Date.now()
            };

            await this.db.saveMessage(userMessage);
            this.addMessageToUI(userMessage);

            // Add loading message
            const assistantMessage = {
                id: this.generateId(),
                chatId: this.currentChatId,
                role: 'assistant',
                content: 'Thinking...',
                timestamp: Date.now()
            };

            const assistantDiv = this.addMessageToUI(assistantMessage);
            this.scrollToBottom();

            try {
                // Get conversation history
                const messages = await this.db.getMessagesByChatId(this.currentChatId);
                const conversationMessages = messages.map(msg => ({
                    role: msg.role,
                    content: msg.content
                }));

                // Call API
                let responseContent = '';
                await this.api.chatCompletion(
                    conversationMessages,
                    this.currentModel,
                    (chunk) => {
                        responseContent += chunk;
                        assistantDiv.textContent = responseContent;
                        this.scrollToBottom();
                    }
                );

                // Save response
                assistantMessage.content = responseContent;
                await this.db.saveMessage(assistantMessage);

                // Update chat title
                await this.updateChatTitleAndPreview(this.currentChatId, content);
                await this.loadChats();

            } catch (error) {
                console.error('Chat error:', error);
                assistantDiv.textContent = 'Error: ' + error.message;
                assistantDiv.style.color = 'red';
            }

            return false;

        } catch (error) {
            console.error('Send message error:', error);
            return false;
        }
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    updateSendButtonState() {
        const hasText = this.messageInput.value.trim().length > 0;
        const hasModel = !!this.currentModel;
        const hasChat = !!this.currentChatId;
        
        const shouldEnable = hasText && hasModel && hasChat && !this.isSending;
        
        if (shouldEnable) {
            this.sendBtn.style.opacity = '1';
            this.sendBtn.style.cursor = 'pointer';
        } else {
            this.sendBtn.style.opacity = '0.5'; 
            this.sendBtn.style.cursor = 'not-allowed';
        }

        // Update button text/appearance when sending
        if (this.isSending) {
            this.sendBtn.style.opacity = '0.5';
            this.sendBtn.style.cursor = 'not-allowed';
        }
    }

    async loadSavedToken() {
        const savedToken = await this.db.getSetting('apiToken');
        if (savedToken) {
            this.tokenInput.value = savedToken;
            this.api.setToken(savedToken);
            await this.validateAndLoadModels();
        }
    }

    async saveToken() {
        const token = this.tokenInput.value.trim();
        if (!token) {
            this.showTokenStatus('Please enter a token', 'error');
            return;
        }

        this.api.setToken(token);
        const isValid = await this.api.validateToken();
        
        if (isValid) {
            await this.db.saveSetting('apiToken', token);
            this.showTokenStatus('Token saved successfully', 'success');
            await this.loadModels();
        } else {
            this.showTokenStatus('Invalid token', 'error');
        }
    }

    showTokenStatus(message, type) {
        this.tokenStatus.textContent = message;
        this.tokenStatus.className = `status ${type}`;
        setTimeout(() => {
            this.tokenStatus.textContent = '';
            this.tokenStatus.className = 'status';
        }, 3000);
    }

    async validateAndLoadModels() {
        const isValid = await this.api.validateToken();
        if (isValid) {
            this.showTokenStatus('Token valid', 'success');
            await this.loadModels();
            // Update send button after models load
            setTimeout(() => this.updateSendButtonState(), 100);
        } else {
            this.showTokenStatus('Token expired or invalid', 'error');
        }
    }

    async loadModels() {
        try {
            this.modelSelect.innerHTML = '<option value="">Loading models...</option>';
            this.models = await this.api.getModels();
            
            console.log('Loaded models:', this.models);
            
            this.modelSelect.innerHTML = '';
            if (this.models.length === 0) {
                this.modelSelect.innerHTML = '<option value="">No models available - Check your token and connection</option>';
                this.showTokenStatus('No models found. Please check your API token and connection.', 'error');
                return;
            }

            this.models.forEach(model => {
                const option = document.createElement('option');
                option.value = model.id;
                option.textContent = model.name || model.id;
                this.modelSelect.appendChild(option);
            });

            // Load saved model preference
            const savedModel = await this.db.getSetting('selectedModel');
            if (savedModel && this.models.find(m => m.id === savedModel)) {
                this.modelSelect.value = savedModel;
                this.currentModel = savedModel;
            } else if (this.models.length > 0) {
                this.modelSelect.value = this.models[0].id;
                this.currentModel = this.models[0].id;
            }

            console.log('Current model set to:', this.currentModel);
            this.updateSendButtonState();
            this.showTokenStatus('Models loaded successfully', 'success');
            
        } catch (error) {
            console.error('Error loading models:', error);
            this.modelSelect.innerHTML = '<option value="">Error loading models</option>';
            this.showTokenStatus(`Error loading models: ${error.message}`, 'error');
        }
    }

    async loadChats() {
        try {
            const chats = await this.db.getChats();
            this.renderChatList(chats);
        } catch (error) {
            console.error('Error loading chats:', error);
        }
    }

    renderChatList(chats) {
        this.chatList.innerHTML = '';
        
        chats.forEach(chat => {
            const chatItem = document.createElement('div');
            chatItem.className = 'chat-item';
            chatItem.dataset.chatId = chat.id;
            
            const title = document.createElement('div');
            title.className = 'chat-item-title';
            title.textContent = chat.title;
            
            const preview = document.createElement('div');
            preview.className = 'chat-item-preview';
            preview.textContent = chat.preview || 'No messages yet';
            
            chatItem.appendChild(title);
            chatItem.appendChild(preview);
            
            chatItem.addEventListener('click', (e) => {
                e.preventDefault();
                this.loadChat(chat.id);
            });
            this.chatList.appendChild(chatItem);
        });
    }

    async createNewChat() {
        const chatId = this.db.generateId();
        const chat = {
            id: chatId,
            title: 'New Chat',
            preview: '',
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        await this.db.saveChat(chat);
        await this.loadChats();
        await this.loadChat(chatId);
    }

    async loadChat(chatId) {
        try {
            this.currentChatId = chatId;
            
            // Update active state in sidebar
            document.querySelectorAll('.chat-item').forEach(item => {
                item.classList.toggle('active', item.dataset.chatId === chatId);
            });

            const messages = await this.db.getMessagesByChatId(chatId);
            this.renderMessages(messages);
            
            // Make sure send button state is updated
            this.updateSendButtonState();
            
            console.log('Chat loaded:', chatId);
        } catch (error) {
            console.error('Error loading chat:', error);
        }
    }

    renderMessages(messages) {
        this.messagesContainer.innerHTML = '';
        
        if (messages.length === 0) {
            this.showEmptyState();
            return;
        }

        messages.forEach(message => {
            this.addMessageToUI(message);
        });

        this.scrollToBottom();
    }

    addMessageToUI(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.role}`;
        messageDiv.textContent = message.content;
        
        this.messagesContainer.appendChild(messageDiv);
        return messageDiv;
    }

    showEmptyState() {
        this.messagesContainer.innerHTML = `
            <div class="empty-state">
                <h2>Welcome to AI Chat</h2>
                <p>Select a model and start a conversation</p>
            </div>
        `;
    }

    async updateChatTitleAndPreview(chatId, userMessage) {
        const chat = await this.db.getChatById(chatId);
        if (chat) {
            // Update title if it's still "New Chat"
            if (chat.title === 'New Chat') {
                chat.title = userMessage.length > 50 ? userMessage.substring(0, 50) + '...' : userMessage;
            }
            
            chat.preview = userMessage.length > 80 ? userMessage.substring(0, 80) + '...' : userMessage;
            chat.updatedAt = Date.now();
            
            await this.db.saveChat(chat);
        }
    }

    adjustTextareaHeight() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
    }

    scrollToBottom() {
        setTimeout(() => {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }, 100);
    }

    showError(message) {
        console.error(message);
        // Could implement a toast notification system here
    }
}

// Initialize the app when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    // Store app instance globally for debugging
    window.chatApp = new ChatApp();
});

// Additional global prevention measures
window.addEventListener('load', () => {
    // Remove any forms that might exist
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            return false;
        });
    });
});
