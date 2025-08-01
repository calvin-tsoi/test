// IndexedDB management for chat history
class ChatDB {
    constructor() {
        this.dbName = 'StandaloneChatDB';
        this.version = 1;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create chats store
                if (!db.objectStoreNames.contains('chats')) {
                    const chatStore = db.createObjectStore('chats', { keyPath: 'id' });
                    chatStore.createIndex('createdAt', 'createdAt', { unique: false });
                }

                // Create messages store
                if (!db.objectStoreNames.contains('messages')) {
                    const messageStore = db.createObjectStore('messages', { keyPath: 'id' });
                    messageStore.createIndex('chatId', 'chatId', { unique: false });
                    messageStore.createIndex('timestamp', 'timestamp', { unique: false });
                }

                // Create settings store
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }
            };
        });
    }

    async saveChat(chat) {
        const transaction = this.db.transaction(['chats'], 'readwrite');
        const store = transaction.objectStore('chats');
        return store.put(chat);
    }

    async getChats() {
        const transaction = this.db.transaction(['chats'], 'readonly');
        const store = transaction.objectStore('chats');
        const index = store.index('createdAt');
        
        return new Promise((resolve, reject) => {
            const request = index.getAll();
            request.onsuccess = () => resolve(request.result.reverse()); // Most recent first
            request.onerror = () => reject(request.error);
        });
    }

    async getChatById(id) {
        const transaction = this.db.transaction(['chats'], 'readonly');
        const store = transaction.objectStore('chats');
        
        return new Promise((resolve, reject) => {
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async saveMessage(message) {
        const transaction = this.db.transaction(['messages'], 'readwrite');
        const store = transaction.objectStore('messages');
        return store.put(message);
    }

    async getMessagesByChatId(chatId) {
        const transaction = this.db.transaction(['messages'], 'readonly');
        const store = transaction.objectStore('messages');
        const index = store.index('chatId');
        
        return new Promise((resolve, reject) => {
            const request = index.getAll(chatId);
            request.onsuccess = () => {
                const messages = request.result.sort((a, b) => a.timestamp - b.timestamp);
                resolve(messages);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async saveSetting(key, value) {
        const transaction = this.db.transaction(['settings'], 'readwrite');
        const store = transaction.objectStore('settings');
        return store.put({ key, value });
    }

    async getSetting(key) {
        const transaction = this.db.transaction(['settings'], 'readonly');
        const store = transaction.objectStore('settings');
        
        return new Promise((resolve, reject) => {
            const request = store.get(key);
            request.onsuccess = () => {
                const result = request.result;
                resolve(result ? result.value : null);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async deleteChat(chatId) {
        const transaction = this.db.transaction(['chats', 'messages'], 'readwrite');
        
        // Delete chat
        const chatStore = transaction.objectStore('chats');
        await chatStore.delete(chatId);
        
        // Delete all messages for this chat
        const messageStore = transaction.objectStore('messages');
        const index = messageStore.index('chatId');
        const request = index.openCursor(chatId);
        
        return new Promise((resolve, reject) => {
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                } else {
                    resolve();
                }
            };
            request.onerror = () => reject(request.error);
        });
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}
