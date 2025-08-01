# DB.js Documentation - IndexedDB Client-Side Database

## Overview

The `db.js` file implements a comprehensive client-side database layer using IndexedDB for the standalone chat application. It provides persistent storage for chat conversations, messages, and application settings, enabling offline functionality and data persistence across browser sessions.

## Architecture

### Database Design

The database uses IndexedDB with three main object stores:
- **`chats`** - Stores chat conversation metadata
- **`messages`** - Stores individual messages within chats
- **`settings`** - Stores application configuration and user preferences

### Key Features

- **Persistent Storage**: Data survives browser restarts and offline usage
- **Transactional Operations**: Ensures data consistency and integrity
- **Indexed Queries**: Optimized retrieval with proper indexing
- **Promise-based API**: Modern async/await compatible interface
- **Automatic Schema Management**: Handles database creation and upgrades

## Class Structure

### ChatDB Class

The main database management class that encapsulates all storage operations.

## Constructor and Configuration

### Constructor (`lines 2-7`)

```javascript
constructor() {
    this.dbName = 'StandaloneChatDB';    // Database name
    this.version = 1;                    // Schema version
    this.db = null;                      // Database connection
}
```

**Properties:**
- **`dbName`**: Database identifier for IndexedDB
- **`version`**: Schema version for upgrades and migrations
- **`db`**: Active database connection instance

**Design Notes:**
- Uses semantic database naming for clarity
- Version management enables future schema changes
- Null database reference until initialization completes

## Database Initialization

### `init()` Method (`lines 9-41`)

Initializes the database connection and creates the schema:

```javascript
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
```

**Process Flow:**
1. **Database Opening**: Attempts to open database with specified name and version
2. **Success Handling**: Sets database reference and resolves promise
3. **Error Handling**: Rejects promise with IndexedDB error
4. **Schema Creation**: Creates object stores and indexes on first run or version upgrade

### Object Store Schemas

#### Chats Store (`lines 23-26`)
```javascript
const chatStore = db.createObjectStore('chats', { keyPath: 'id' });
chatStore.createIndex('createdAt', 'createdAt', { unique: false });
```

**Structure:**
- **Primary Key**: `id` (unique chat identifier)
- **Index**: `createdAt` (for chronological ordering)

**Chat Object Schema:**
```javascript
{
    id: "chat_id_here",
    title: "Chat Title",
    preview: "Last message preview...",
    createdAt: 1640995200000,
    updatedAt: 1640995200000
}
```

#### Messages Store (`lines 29-33`)
```javascript
const messageStore = db.createObjectStore('messages', { keyPath: 'id' });
messageStore.createIndex('chatId', 'chatId', { unique: false });
messageStore.createIndex('timestamp', 'timestamp', { unique: false });
```

**Structure:**
- **Primary Key**: `id` (unique message identifier)
- **Index**: `chatId` (for retrieving messages by chat)
- **Index**: `timestamp` (for chronological ordering)

**Message Object Schema:**
```javascript
{
    id: "message_id_here",
    chatId: "parent_chat_id",
    role: "user" | "assistant",
    content: "Message content text...",
    timestamp: 1640995200000
}
```

#### Settings Store (`lines 36-38`)
```javascript
db.createObjectStore('settings', { keyPath: 'key' });
```

**Structure:**
- **Primary Key**: `key` (setting identifier)

**Setting Object Schema:**
```javascript
{
    key: "setting_name",
    value: "setting_value" // Can be any serializable type
}
```

## Chat Management Operations

### `saveChat()` Method (`lines 43-47`)

Saves or updates a chat conversation:

```javascript
async saveChat(chat) {
    const transaction = this.db.transaction(['chats'], 'readwrite');
    const store = transaction.objectStore('chats');
    return store.put(chat);
}
```

**Parameters:**
- **`chat`**: Chat object to save

**Behavior:**
- **Insert or Update**: Uses `put()` which creates new or updates existing
- **Transactional**: Ensures atomic operation
- **Automatic Timestamps**: Application should manage `createdAt` and `updatedAt`

**Usage Example:**
```javascript
const chat = {
    id: db.generateId(),
    title: "New Conversation",
    preview: "Hello, how are you?",
    createdAt: Date.now(),
    updatedAt: Date.now()
};

await db.saveChat(chat);
```

### `getChats()` Method (`lines 49-59`)

Retrieves all chat conversations ordered by creation date:

```javascript
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
```

**Returns:** `Array<Chat>` - Array of chat objects, most recent first

**Key Features:**
- **Indexed Retrieval**: Uses `createdAt` index for efficient ordering
- **Reverse Chronological**: Most recent chats appear first
- **Complete Dataset**: Returns all chats without pagination

**Usage Example:**
```javascript
const chats = await db.getChats();
console.log(`Found ${chats.length} conversations`);
chats.forEach(chat => {
    console.log(`${chat.title}: ${chat.preview}`);
});
```

### `getChatById()` Method (`lines 61-70`)

Retrieves a specific chat by its ID:

```javascript
async getChatById(id) {
    const transaction = this.db.transaction(['chats'], 'readonly');
    const store = transaction.objectStore('chats');
    
    return new Promise((resolve, reject) => {
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}
```

**Parameters:**
- **`id`**: Unique chat identifier

**Returns:** `Chat | undefined` - Chat object if found, undefined otherwise

**Usage Example:**
```javascript
const chat = await db.getChatById('chat_123');
if (chat) {
    console.log(`Found chat: ${chat.title}`);
} else {
    console.log('Chat not found');
}
```

### `deleteChat()` Method (`lines 113-137`)

Deletes a chat and all associated messages:

```javascript
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
```

**Parameters:**
- **`chatId`**: ID of chat to delete

**Key Features:**
- **Cascade Delete**: Automatically removes all associated messages
- **Transactional**: Both chat and message deletions occur atomically
- **Cursor-based**: Efficiently handles large message sets
- **Complete Cleanup**: Ensures no orphaned data remains

**Usage Example:**
```javascript
try {
    await db.deleteChat('chat_123');
    console.log('Chat and all messages deleted successfully');
} catch (error) {
    console.error('Failed to delete chat:', error);
}
```

## Message Management Operations

### `saveMessage()` Method (`lines 72-76`)

Saves a message to a chat conversation:

```javascript
async saveMessage(message) {
    const transaction = this.db.transaction(['messages'], 'readwrite');
    const store = transaction.objectStore('messages');
    return store.put(message);
}
```

**Parameters:**
- **`message`**: Message object to save

**Message Structure:**
```javascript
{
    id: "unique_message_id",
    chatId: "parent_chat_id", 
    role: "user" | "assistant",
    content: "Message text content",
    timestamp: 1640995200000
}
```

**Usage Example:**
```javascript
const message = {
    id: db.generateId(),
    chatId: currentChatId,
    role: 'user',
    content: 'Hello, how can you help me?',
    timestamp: Date.now()
};

await db.saveMessage(message);
```

### `getMessagesByChatId()` Method (`lines 78-91`)

Retrieves all messages for a specific chat, ordered by timestamp:

```javascript
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
```

**Parameters:**
- **`chatId`**: ID of chat to retrieve messages for

**Returns:** `Array<Message>` - Messages ordered chronologically (oldest first)

**Key Features:**
- **Indexed Query**: Uses `chatId` index for efficient retrieval
- **Chronological Order**: Sorts by timestamp for proper conversation flow
- **Complete History**: Returns entire conversation history

**Usage Example:**
```javascript
const messages = await db.getMessagesByChatId('chat_123');
messages.forEach(msg => {
    console.log(`${msg.role}: ${msg.content}`);
});
```

## Settings Management

### `saveSetting()` Method (`lines 93-97`)

Stores application settings and user preferences:

```javascript
async saveSetting(key, value) {
    const transaction = this.db.transaction(['settings'], 'readwrite');
    const store = transaction.objectStore('settings');
    return store.put({ key, value });
}
```

**Parameters:**
- **`key`**: Setting identifier (string)
- **`value`**: Setting value (any serializable type)

**Usage Examples:**
```javascript
// Store API token
await db.saveSetting('apiToken', 'your-api-token-here');

// Store user preferences
await db.saveSetting('selectedModel', 'llama2:7b');
await db.saveSetting('theme', 'dark');
await db.saveSetting('autoSave', true);

// Store complex objects
await db.saveSetting('userProfile', {
    name: 'John Doe',
    preferences: {
        language: 'en',
        notifications: true
    }
});
```

### `getSetting()` Method (`lines 99-111`)

Retrieves a stored setting value:

```javascript
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
```

**Parameters:**
- **`key`**: Setting identifier to retrieve

**Returns:** Setting value or `null` if not found

**Usage Examples:**
```javascript
// Retrieve simple values
const apiToken = await db.getSetting('apiToken');
const selectedModel = await db.getSetting('selectedModel');

// Handle missing settings
const theme = await db.getSetting('theme') || 'light';

// Retrieve complex objects
const userProfile = await db.getSetting('userProfile');
if (userProfile) {
    console.log(`Welcome back, ${userProfile.name}!`);
}
```

## Utility Functions

### `generateId()` Method (`lines 139-141`)

Generates unique identifiers for database records:

```javascript
generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
```

**Returns:** `string` - Unique identifier

**Algorithm:**
- **Timestamp Component**: `Date.now().toString(36)` - Current time in base-36
- **Random Component**: `Math.random().toString(36).substr(2)` - Random suffix
- **Combined**: Creates practically unique IDs with temporal ordering

**Example Output:**
```javascript
const id1 = db.generateId(); // "k8j2m4n3x9"
const id2 = db.generateId(); // "k8j2m4n3y2"
```

**Usage Example:**
```javascript
// Create new chat with unique ID
const chatId = db.generateId();
const chat = {
    id: chatId,
    title: 'New Chat',
    createdAt: Date.now(),
    updatedAt: Date.now()
};

// Create message with unique ID
const messageId = db.generateId();
const message = {
    id: messageId,
    chatId: chatId,
    role: 'user',
    content: 'Hello!',
    timestamp: Date.now()
};
```

## IndexedDB Patterns and Best Practices

### Transaction Management

#### Read Transactions
```javascript
// Single store read
const transaction = this.db.transaction(['chats'], 'readonly');

// Multiple store read  
const transaction = this.db.transaction(['chats', 'messages'], 'readonly');
```

#### Write Transactions
```javascript
// Single store write
const transaction = this.db.transaction(['messages'], 'readwrite');

// Multiple store write (for atomic operations)
const transaction = this.db.transaction(['chats', 'messages'], 'readwrite');
```

### Error Handling Strategy

#### Promise-based Error Handling
```javascript
// Consistent error handling pattern
return new Promise((resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
});
```

#### Transaction Error Handling
```javascript
try {
    await db.saveMessage(message);
    console.log('Message saved successfully');
} catch (error) {
    console.error('Failed to save message:', error);
    // Handle specific error types
    if (error.name === 'QuotaExceededError') {
        console.error('Storage quota exceeded');
    }
}
```

### Index Usage Optimization

#### Efficient Queries
```javascript
// Good: Use indexes for filtering
const index = store.index('chatId');
const request = index.getAll(chatId);

// Good: Use indexes for ordering
const index = store.index('createdAt');
const request = index.getAll();

// Avoid: Full table scans without indexes
const request = store.getAll(); // Then filter in JavaScript
```

#### Query Performance
- **Use Indexes**: Always query through appropriate indexes
- **Limit Results**: Consider pagination for large datasets
- **Batch Operations**: Group related operations in single transactions

## Data Models

### Chat Model
```javascript
interface Chat {
    id: string;              // Unique identifier
    title: string;           // Display name
    preview: string;         // Last message preview
    createdAt: number;       // Unix timestamp
    updatedAt: number;       // Unix timestamp
}
```

### Message Model
```javascript
interface Message {
    id: string;              // Unique identifier
    chatId: string;          // Parent chat ID
    role: 'user' | 'assistant'; // Message sender
    content: string;         // Message text
    timestamp: number;       // Unix timestamp
}
```

### Setting Model
```javascript
interface Setting {
    key: string;            // Setting identifier
    value: any;             // Setting value (serializable)
}
```

## Advanced Usage Patterns

### Batch Operations

#### Bulk Message Insert
```javascript
async saveBulkMessages(messages) {
    const transaction = this.db.transaction(['messages'], 'readwrite');
    const store = transaction.objectStore('messages');
    
    const promises = messages.map(message => store.put(message));
    await Promise.all(promises);
}
```

#### Chat Import/Export
```javascript
async exportChat(chatId) {
    const chat = await this.getChatById(chatId);
    const messages = await this.getMessagesByChatId(chatId);
    
    return {
        chat,
        messages,
        exportedAt: Date.now()
    };
}

async importChat(chatData) {
    await this.saveChat(chatData.chat);
    await this.saveBulkMessages(chatData.messages);
}
```

### Data Migration
```javascript
// Future version upgrade example
request.onupgradeneeded = (event) => {
    const db = event.target.result;
    const oldVersion = event.oldVersion;
    
    if (oldVersion < 2) {
        // Add new index for version 2
        const messageStore = transaction.objectStore('messages');
        messageStore.createIndex('searchContent', 'content', { unique: false });
    }
    
    if (oldVersion < 3) {
        // Add new store for version 3
        db.createObjectStore('attachments', { keyPath: 'id' });
    }
};
```

### Storage Management
```javascript
async getDatabaseSize() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return {
            used: estimate.usage,
            available: estimate.quota
        };
    }
    return null;
}

async clearAllData() {
    const transaction = this.db.transaction(['chats', 'messages', 'settings'], 'readwrite');
    
    await Promise.all([
        transaction.objectStore('chats').clear(),
        transaction.objectStore('messages').clear(),
        transaction.objectStore('settings').clear()
    ]);
}
```

## Error Handling and Recovery

### Common Error Types

#### QuotaExceededError
```javascript
try {
    await db.saveMessage(message);
} catch (error) {
    if (error.name === 'QuotaExceededError') {
        // Handle storage quota exceeded
        await cleanupOldChats();
        // Retry operation
    }
}
```

#### InvalidStateError
```javascript
try {
    await db.getChats();
} catch (error) {
    if (error.name === 'InvalidStateError') {
        // Database connection lost, reinitialize
        await db.init();
        return await db.getChats();
    }
}
```

#### VersionError
```javascript
try {
    await db.init();
} catch (error) {
    if (error.name === 'VersionError') {
        // Version conflict, database was upgraded elsewhere
        // Reload the page or handle gracefully
        window.location.reload();
    }
}
```

### Recovery Strategies

#### Connection Recovery
```javascript
async ensureConnection() {
    if (!this.db || this.db.version !== this.version) {
        await this.init();
    }
}

async safeOperation(operation) {
    try {
        return await operation();
    } catch (error) {
        if (error.name === 'InvalidStateError') {
            await this.ensureConnection();
            return await operation();
        }
        throw error;
    }
}
```

#### Data Integrity Checks
```javascript
async validateData() {
    const chats = await this.getChats();
    const issues = [];
    
    for (const chat of chats) {
        const messages = await this.getMessagesByChatId(chat.id);
        if (messages.length === 0 && chat.preview) {
            issues.push(`Chat ${chat.id} has preview but no messages`);
        }
    }
    
    return issues;
}
```

## Performance Considerations

### Optimization Strategies

1. **Index Usage**: Always query through appropriate indexes
2. **Transaction Scope**: Keep transactions as short as possible
3. **Batch Operations**: Group related operations together
4. **Memory Management**: Don't load large datasets into memory at once
5. **Connection Reuse**: Maintain single database connection

### Performance Monitoring
```javascript
async measureOperation(operation, name) {
    const start = performance.now();
    const result = await operation();
    const duration = performance.now() - start;
    console.log(`${name} took ${duration.toFixed(2)}ms`);
    return result;
}

// Usage
const chats = await measureOperation(
    () => db.getChats(),
    'Load chats'
);
```

## Complete Usage Example

```javascript
// Initialize database
const db = new ChatDB();
await db.init();

// Save user preferences
await db.saveSetting('apiToken', 'your-token');
await db.saveSetting('selectedModel', 'llama2:7b');

// Create new chat
const chatId = db.generateId();
const chat = {
    id: chatId,
    title: 'New Conversation',
    preview: '',
    createdAt: Date.now(),
    updatedAt: Date.now()
};
await db.saveChat(chat);

// Add messages to chat
const userMessage = {
    id: db.generateId(),
    chatId: chatId,
    role: 'user',
    content: 'Hello, can you help me with JavaScript?',
    timestamp: Date.now()
};
await db.saveMessage(userMessage);

const assistantMessage = {
    id: db.generateId(),
    chatId: chatId,
    role: 'assistant',
    content: 'Of course! I\'d be happy to help you with JavaScript.',
    timestamp: Date.now()
};
await db.saveMessage(assistantMessage);

// Update chat preview
chat.preview = userMessage.content;
chat.updatedAt = Date.now();
await db.saveChat(chat);

// Retrieve conversation
const messages = await db.getMessagesByChatId(chatId);
console.log('Conversation:', messages);

// Load all chats
const allChats = await db.getChats();
console.log(`Total chats: ${allChats.length}`);

// Clean up
await db.deleteChat(chatId);
```

This IndexedDB implementation provides a robust, efficient, and scalable solution for client-side data persistence in the standalone chat application, with comprehensive error handling and performance optimization.
