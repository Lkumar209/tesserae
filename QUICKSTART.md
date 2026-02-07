# 🚀 Tesserae Quick Start Guide

Get Tesserae running locally in under 5 minutes!

## Prerequisites

- Node.js 18+ installed
- Groq API key ([sign up here](https://console.groq.com/))

## Setup Steps

### 1. Install Dependencies

From the root directory:

```bash
# Install both client and server dependencies
npm run install:all
```

Or install separately:

```bash
# Server
cd server
npm install

# Client
cd ../client
npm install
```

### 2. Configure Environment Variables

**Server** - Create `server/.env`:
```bash
GROQ_API_KEY=your-groq-key-here
PORT=3001
CLIENT_URL=http://localhost:5173
```

**Client** - Create `client/.env`:
```bash
VITE_SOCKET_URL=http://localhost:3001
```

### 3. Start the Application

**Option A: Two Terminals**

Terminal 1 - Start Server:
```bash
cd server
npm run dev
```

Terminal 2 - Start Client:
```bash
cd client
npm run dev
```

**Option B: Separate Commands**
```bash
# Terminal 1
npm run dev:server

# Terminal 2
npm run dev:client
```

### 4. Open Your Browser

Navigate to: `http://localhost:5173`

### 5. Test Multi-User Functionality

Open multiple browser tabs/windows to `http://localhost:5173` to simulate multiple users drawing simultaneously!

## 🎨 First Steps

1. **Click any empty tile** (marked with +) to start drawing
2. **Choose a color** from the AI-suggested palette
3. **Draw on the 16x16 grid** by clicking or dragging
4. **Save your tile** to broadcast it to all users
5. **Click "Reveal Full Mosaic"** to see the complete artwork

## 🔍 Verify Everything Works

- You should see "🟢 Connected" in the status bar
- User count should show at least 1 (you)
- Clicking a tile should open the drawing canvas
- AI-suggested colors should appear (requires valid API key)

## 🐛 Troubleshooting

**Server won't start:**
- Check if port 3001 is available
- Verify GROQ_API_KEY is set in `server/.env`
- Run `npm install` in server directory

**Client won't start:**
- Check if port 5173 is available
- Verify Vite is installed: `npm list vite`
- Run `npm install` in client directory

**No real-time updates:**
- Check server console for Socket.io connection logs
- Verify VITE_SOCKET_URL in `client/.env` matches server URL
- Check browser console for WebSocket errors

**AI colors not loading:**
- Verify GROQ_API_KEY is correct and has credits
- Check server console for API errors
- Fallback colors will still work if API fails

## 📊 What to Expect

- **Server console**: Connection logs, tile updates, API calls
- **Browser console**: Socket.io debug info, component renders
- **UI**: Live user count, tile updates, connection status

## 🎯 Next Steps

- Invite friends to test collaborative features
- Try creating patterns across multiple tiles
- Experiment with AI color suggestions
- Check the full [README.md](README.md) for deployment options

## 💡 Tips

- Use the **heatmap** to see contribution density
- The **anti-clustering warning** helps create visual variety
- **AI suggestions** are based on neighboring tiles
- Each user gets a unique username like `Artist_abc123`

---

**Need help?** Check the full [README.md](README.md) or open an issue!
