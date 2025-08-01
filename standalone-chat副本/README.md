# Standalone AI Chat

A simple, standalone chat interface that connects to your Open WebUI backend.

## Features

- 🗨️ Clean chat interface
- 💾 Local chat history storage using IndexedDB
- 🔄 Real-time streaming responses
- 📱 Responsive design
- 🎯 Simple setup and usage

## Setup

1. Place all files in a folder named `standalone-chat`
2. Serve the files from a web server (required for IndexedDB to work)
3. Open `index.html` in your browser
4. Enter your API token from Open WebUI
5. Start chatting!

## File Structure

- `index.html` - Main HTML structure
- `styles.css` - All styling and responsive design
- `db.js` - IndexedDB management for local storage
- `api.js` - API client for Open WebUI communication
- `app.js` - Main application logic and UI management

## Requirements

- A running Open WebUI instance
- Valid API token from Open WebUI
- Modern web browser with IndexedDB support
- Web server (for serving files, can't be opened directly as file://)

## Usage

1. **Get API Token**: Log into your Open WebUI and get an API token
2. **Enter Token**: Paste the token in the input field and click "Save Token"
3. **Select Model**: Choose a model from the dropdown
4. **Start Chatting**: Click "New Chat" and start your conversation

All chat history is stored locally in your browser using IndexedDB.
