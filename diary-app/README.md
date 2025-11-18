# Diary AI Assistant

A Progressive Web App (PWA) that provides an AI-powered interface to interact with your personal diary repository. Built following Erik Kennedy's UI heuristics and Dan Mall's design principles.

## Features

- 🤖 **AI Chat Interface**: Chat with your diary using OpenRouter API
- 📁 **File Management**: Browse and search through all your diary files
- 🔍 **Smart Search**: Semantic search across your entire diary
- 📱 **Mobile-First PWA**: Install on Android like a native app
- 🎨 **Beautiful UI**: Following modern design heuristics
- 📖 **Read-Only File Viewer**: View files with proper markdown rendering

## Quick Setup

### 1. Install Dependencies
```bash
cd diary-app
npm install
```

### 2. Configure Environment
```bash
cp env.example .env
```

Edit `.env` and add your OpenRouter API key:
```
OPENROUTER_API_KEY=your_openrouter_api_key_here
PORT=3000
NODE_ENV=development
DIARY_PATH=..
```

### 3. Start the Server
```bash
npm start
```

### 4. Access on Your Android Phone
1. Open your phone's browser
2. Navigate to `http://YOUR_COMPUTER_IP:3000`
3. Tap "Add to Home Screen" when prompted
4. The app will install like a native app!

## Usage

### Chat with Your Diary
- Ask questions about your goals, projects, or behavioral patterns
- Get AI insights based on your diary content
- View relevant file excerpts in chat responses

### Browse Files
- View all your diary files organized by date
- Filter by type (Daily Notes, Projects, Goals)
- Search within file contents

### Search Functionality
- Search across all your diary content
- Get instant results with file excerpts
- Click any result to view the full file

## Design Principles

This app follows Erik Kennedy's UI heuristics:

- ✅ **8pt Grid System**: All spacing follows 4/8/16/24px increments
- ✅ **Light from Sky**: Proper drop shadows and highlights
- ✅ **Black & White First**: Strong hierarchy before color
- ✅ **Double Whitespace**: Generous spacing for clarity
- ✅ **One Accent Color**: Consistent purple theme with variations
- ✅ **Typography Hierarchy**: Clear text contrast and sizing
- ✅ **Mobile-First**: Touch-friendly interface
- ✅ **Progressive Enhancement**: Works offline after first load

## File Structure

```
diary-app/
├── server.js          # Express server with AI integration
├── package.json       # Dependencies and scripts
├── .env               # Environment variables (create from env.example)
├── public/
│   ├── index.html     # Main app interface
│   ├── styles.css     # Erik Kennedy-inspired CSS
│   ├── app.js         # Frontend JavaScript
│   ├── manifest.json  # PWA manifest
│   └── sw.js          # Service worker
└── README.md          # This file
```

## API Endpoints

- `GET /api/files` - Get all indexed files
- `GET /api/files/:id` - Get specific file content
- `GET /api/search?q=query` - Search files
- `POST /api/chat` - Send message to AI
- `GET /api/chat/history` - Get chat history

## Google Drive Sync

Since your diary files are synced via Google Drive to your mobile:
- Files are automatically indexed when they change
- Real-time updates when you add new notes
- Works offline after initial sync
- No need to manually upload files

## Customization

### Adding New File Types
Edit the file indexing logic in `server.js` to include additional file extensions or patterns.

### Changing AI Model
Modify the model in the chat endpoint:
```javascript
model: "openai/gpt-4o-mini" // Change to your preferred model
```

### Styling
The CSS follows a systematic design system. Modify CSS custom properties in `styles.css` to change colors, spacing, or typography.

## Troubleshooting

### App Won't Install on Android
- Ensure you're using Chrome or Edge browser
- Check that the site is served over HTTPS (or localhost)
- Look for the "Add to Home Screen" prompt

### AI Chat Not Working
- Verify your OpenRouter API key is correct
- Check the server console for error messages
- Ensure you have sufficient API credits

### Files Not Loading
- Check that the DIARY_PATH in .env points to your diary folder
- Verify file permissions
- Look for indexing errors in server console

## Development

### Running in Development Mode
```bash
npm run dev
```

### Building CSS
```bash
npm run build:css
```

## License

Personal use only - this is your private diary assistant!
