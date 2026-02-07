# Tesserae - Collaborative Pixel Art Mosaic

Tesserae is a collaborative pixel art platform where artists come together to create beautiful mosaics in real-time. Jump into themed galleries like Nature, Space, or Abstract, grab a brush, and start painting—your tiles instantly appear for everyone else. The app uses Groq AI to suggest harmonious colors based on what's already been painted nearby, helping the mosaic flow naturally. You can watch time-lapse replays of entire artworks being built tile-by-tile, see contribution heatmaps showing where the action is, and switch between different brush sizes as you work. Built with React, Node.js, and Socket.io, it's designed around the idea that great art emerges when fragments come together.

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

