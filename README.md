# Tesserae - Collaborative Pixel Art Mosaic

A real-time collaborative pixel art application where multiple artists can create beautiful mosaics together.

## Features

- 🎨 **Real-time Collaboration** - Multiple users can draw simultaneously
- 🖼️ **Multiple Themed Galleries** - Nature, Space, Abstract, and Societal Murals
- ⏱️ **Time-lapse Replay** - Watch mosaics being created over time
- 🤖 **AI Color Suggestions** - Groq AI suggests harmonious colors based on adjacent tiles
- 🎯 **Variable Brush Sizes** - Paint with 1x1, 2x2, 3x3, or 4x4 pixel brushes
- 🔥 **Heatmap View** - Visualize contributor activity
- 🌟 **Glassmorphism UI** - Modern, beautiful interface with smooth animations

## Tech Stack

### Frontend
- React 18 + Vite
- Framer Motion (animations)
- Lucide React (icons)
- Socket.io Client (real-time updates)

### Backend
- Node.js + Express
- Socket.io (WebSocket server)
- Groq API (Llama 3.3 70B for AI suggestions)

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Groq API key

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/tesserae.git
cd tesserae
```

2. Install server dependencies
```bash
cd server
npm install
```

3. Install client dependencies
```bash
cd ../client
npm install
```

4. Set up environment variables

Create a `.env` file in the `server` directory:
```
GROQ_API_KEY=your_groq_api_key_here
PORT=3001
CLIENT_URL=http://localhost:5173
```

5. Start the server
```bash
cd server
npm run dev
```

6. Start the client (in a new terminal)
```bash
cd client
npm run dev
```

7. Open your browser to `http://localhost:5173`

## Project Structure

```
tesserae/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom hooks
│   │   ├── styles/        # Global styles
│   │   └── App.jsx        # Main app component
│   └── package.json
├── server/                # Node.js backend
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   └── server.js         # Main server file
└── README.md
```

## Gallery Themes

- **Main Gallery** - Freestyle collaborative canvas
- **Nature & Wildlife** - Natural landscapes and animals
- **Cosmic Dreams** - Space and cosmic themes
- **Abstract Expressions** - Bold colors and geometric patterns
- **Societal Murals** - Community art representing urban life

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## License

MIT License - feel free to use this project for your portfolio or hackathon submissions!

---

Built with ❤️ using Claude Code
