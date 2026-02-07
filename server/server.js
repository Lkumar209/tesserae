import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import tilesRouter from './routes/tiles.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Multi-gallery storage
// Structure: galleryId -> { tiles, metadata, history, challenge }
export const galleries = new Map();

// Initialize default gallery
const createEmptyTiles = () => {
  const tiles = new Map();
  for (let i = 0; i < 100; i++) {
    tiles.set(i, {
      pixels: Array(16).fill(null).map(() => Array(16).fill('#FFFFFF')),
      author: null,
      timestamp: null
    });
  }
  return tiles;
};

const createGallery = (id, name, theme, description, template = null) => {
  const tiles = template ? applyTemplate(template) : createEmptyTiles();

  return {
    id,
    name,
    theme,
    description,
    tiles,
    history: [], // Array of { tileId, pixels, author, timestamp }
    challenge: null, // { name, endTime, votes }
    createdAt: Date.now(),
    lastActivity: Date.now()
  };
};

const applyTemplate = (templateName) => {
  const tiles = createEmptyTiles();
  const template = templates.get(templateName);

  if (template && template.tiles) {
    template.tiles.forEach((tileData, tileId) => {
      tiles.set(tileId, { ...tileData });
    });
  }

  return tiles;
};

// Generate preset mosaic with artificial history
const createPresetMosaic = (patterns, baseTimestamp) => {
  const tiles = createEmptyTiles();
  const history = [];

  patterns.forEach(({ tileId, pattern, author, delay }) => {
    const pixels = pattern();
    const timestamp = baseTimestamp + delay;

    tiles.set(tileId, {
      pixels,
      author,
      timestamp
    });

    history.push({
      tileId,
      pixels,
      author,
      timestamp
    });
  });

  return { tiles, history };
};

// Preset mosaic patterns
const createGradientTile = (colors) => {
  return Array(16).fill(null).map((_, y) =>
    Array(16).fill(null).map((_, x) => {
      const index = Math.floor((y / 16) * colors.length);
      return colors[index];
    })
  );
};

const createSolidTile = (color) => {
  return Array(16).fill(null).map(() => Array(16).fill(color));
};

const createCheckerTile = (color1, color2) => {
  return Array(16).fill(null).map((_, y) =>
    Array(16).fill(null).map((_, x) =>
      (x + y) % 2 === 0 ? color1 : color2
    )
  );
};

const createDiamondTile = (centerColor, edgeColor) => {
  return Array(16).fill(null).map((_, y) =>
    Array(16).fill(null).map((_, x) => {
      const distFromCenter = Math.abs(x - 7.5) + Math.abs(y - 7.5);
      return distFromCenter < 8 ? centerColor : edgeColor;
    })
  );
};

const createCircleTile = (innerColor, outerColor) => {
  return Array(16).fill(null).map((_, y) =>
    Array(16).fill(null).map((_, x) => {
      const dx = x - 7.5;
      const dy = y - 7.5;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance < 6 ? innerColor : outerColor;
    })
  );
};

// Initialize main gallery (empty for user contributions)
galleries.set('main', createGallery('main', 'Main Gallery', 'freestyle', 'The original collaborative canvas'));

// Create societal murals preset gallery
const baseTime = Date.now() - (24 * 60 * 60 * 1000); // 1 day ago
const societalPatterns = [
  // Top row - warm sunset gradient
  { tileId: 0, pattern: () => createGradientTile(['#FF6B6B', '#FF8E53', '#FFAA5C', '#FFD93D']), author: 'Artist_Maya', delay: 1000 },
  { tileId: 1, pattern: () => createGradientTile(['#FF8E53', '#FFAA5C', '#FFD93D', '#FFE66D']), author: 'Artist_Jordan', delay: 2500 },
  { tileId: 2, pattern: () => createGradientTile(['#FFAA5C', '#FFD93D', '#FFE66D', '#FFF89A']), author: 'Artist_Alex', delay: 4000 },
  { tileId: 3, pattern: () => createGradientTile(['#FFD93D', '#FFE66D', '#FFF89A', '#FFE66D']), author: 'Artist_Sam', delay: 5500 },
  { tileId: 4, pattern: () => createGradientTile(['#FFE66D', '#FFF89A', '#FFE66D', '#FFD93D']), author: 'Artist_Riley', delay: 7000 },
  { tileId: 5, pattern: () => createGradientTile(['#FFF89A', '#FFE66D', '#FFD93D', '#FFAA5C']), author: 'Artist_Casey', delay: 8500 },
  { tileId: 6, pattern: () => createGradientTile(['#FFE66D', '#FFD93D', '#FFAA5C', '#FF8E53']), author: 'Artist_Morgan', delay: 10000 },
  { tileId: 7, pattern: () => createGradientTile(['#FFD93D', '#FFAA5C', '#FF8E53', '#FF6B6B']), author: 'Artist_Taylor', delay: 11500 },
  { tileId: 8, pattern: () => createGradientTile(['#FFAA5C', '#FF8E53', '#FF6B6B', '#EE5A6F']), author: 'Artist_Jamie', delay: 13000 },
  { tileId: 9, pattern: () => createGradientTile(['#FF8E53', '#FF6B6B', '#EE5A6F', '#D946A6']), author: 'Artist_Avery', delay: 14500 },

  // Community symbols row - circles and diamonds
  { tileId: 10, pattern: () => createCircleTile('#4ECDC4', '#1A535C'), author: 'Artist_Quinn', delay: 16000 },
  { tileId: 11, pattern: () => createDiamondTile('#FFE66D', '#FF6B6B'), author: 'Artist_Sage', delay: 17500 },
  { tileId: 12, pattern: () => createCircleTile('#95E1D3', '#2A9D8F'), author: 'Artist_River', delay: 19000 },
  { tileId: 13, pattern: () => createDiamondTile('#F38375', '#E63946'), author: 'Artist_Sky', delay: 20500 },
  { tileId: 14, pattern: () => createCircleTile('#A8DADC', '#457B9D'), author: 'Artist_Kai', delay: 22000 },
  { tileId: 15, pattern: () => createDiamondTile('#F4A261', '#E76F51'), author: 'Artist_Drew', delay: 23500 },
  { tileId: 16, pattern: () => createCircleTile('#06D6A0', '#118AB2'), author: 'Artist_Blake', delay: 25000 },
  { tileId: 17, pattern: () => createDiamondTile('#EF476F', '#F78C6B'), author: 'Artist_Phoenix', delay: 26500 },
  { tileId: 18, pattern: () => createCircleTile('#FFD166', '#FFA400'), author: 'Artist_Eden', delay: 28000 },
  { tileId: 19, pattern: () => createDiamondTile('#8338EC', '#A05195'), author: 'Artist_Rowan', delay: 29500 },

  // Urban landscape - building silhouettes
  { tileId: 20, pattern: () => createSolidTile('#2C3E50'), author: 'Artist_Finn', delay: 31000 },
  { tileId: 21, pattern: () => createCheckerTile('#34495E', '#2C3E50'), author: 'Artist_Harper', delay: 32500 },
  { tileId: 22, pattern: () => createSolidTile('#34495E'), author: 'Artist_Sage', delay: 34000 },
  { tileId: 23, pattern: () => createCheckerTile('#2C3E50', '#1A252F'), author: 'Artist_Jordan', delay: 35500 },
  { tileId: 24, pattern: () => createSolidTile('#1A252F'), author: 'Artist_Parker', delay: 37000 },
  { tileId: 25, pattern: () => createCheckerTile('#34495E', '#2C3E50'), author: 'Artist_Riley', delay: 38500 },
  { tileId: 26, pattern: () => createSolidTile('#2C3E50'), author: 'Artist_Morgan', delay: 40000 },
  { tileId: 27, pattern: () => createCheckerTile('#1A252F', '#34495E'), author: 'Artist_Alex', delay: 41500 },
  { tileId: 28, pattern: () => createSolidTile('#34495E'), author: 'Artist_Taylor', delay: 43000 },
  { tileId: 29, pattern: () => createCheckerTile('#2C3E50', '#1A252F'), author: 'Artist_Casey', delay: 44500 },

  // Green space - parks and nature
  { tileId: 30, pattern: () => createGradientTile(['#27AE60', '#2ECC71', '#58D68D', '#82E0AA']), author: 'Artist_Avery', delay: 46000 },
  { tileId: 31, pattern: () => createCircleTile('#F39C12', '#27AE60'), author: 'Artist_Quinn', delay: 47500 },
  { tileId: 32, pattern: () => createGradientTile(['#2ECC71', '#58D68D', '#82E0AA', '#ABEBC6']), author: 'Artist_River', delay: 49000 },
  { tileId: 33, pattern: () => createCircleTile('#E74C3C', '#2ECC71'), author: 'Artist_Sky', delay: 50500 },
  { tileId: 34, pattern: () => createGradientTile(['#58D68D', '#82E0AA', '#ABEBC6', '#D5F4E6']), author: 'Artist_Blake', delay: 52000 },
  { tileId: 35, pattern: () => createCircleTile('#3498DB', '#27AE60'), author: 'Artist_Drew', delay: 53500 },
  { tileId: 36, pattern: () => createGradientTile(['#82E0AA', '#ABEBC6', '#D5F4E6', '#ABEBC6']), author: 'Artist_Phoenix', delay: 55000 },
  { tileId: 37, pattern: () => createCircleTile('#F1C40F', '#2ECC71'), author: 'Artist_Eden', delay: 56500 },
  { tileId: 38, pattern: () => createGradientTile(['#ABEBC6', '#D5F4E6', '#ABEBC6', '#82E0AA']), author: 'Artist_Finn', delay: 58000 },
  { tileId: 39, pattern: () => createCircleTile('#9B59B6', '#27AE60'), author: 'Artist_Harper', delay: 59500 },

  // Water feature - blue gradient
  { tileId: 40, pattern: () => createGradientTile(['#3498DB', '#5DADE2', '#85C1E2', '#AED6F1']), author: 'Artist_Rowan', delay: 61000 },
  { tileId: 41, pattern: () => createGradientTile(['#5DADE2', '#85C1E2', '#AED6F1', '#D6EAF8']), author: 'Artist_Maya', delay: 62500 },
  { tileId: 42, pattern: () => createGradientTile(['#85C1E2', '#AED6F1', '#D6EAF8', '#EBF5FB']), author: 'Artist_Sam', delay: 64000 },
  { tileId: 43, pattern: () => createGradientTile(['#AED6F1', '#D6EAF8', '#EBF5FB', '#D6EAF8']), author: 'Artist_Kai', delay: 65500 },
  { tileId: 44, pattern: () => createGradientTile(['#D6EAF8', '#EBF5FB', '#D6EAF8', '#AED6F1']), author: 'Artist_Jamie', delay: 67000 },
  { tileId: 45, pattern: () => createGradientTile(['#EBF5FB', '#D6EAF8', '#AED6F1', '#85C1E2']), author: 'Artist_Parker', delay: 68500 },
  { tileId: 46, pattern: () => createGradientTile(['#D6EAF8', '#AED6F1', '#85C1E2', '#5DADE2']), author: 'Artist_Jordan', delay: 70000 },
  { tileId: 47, pattern: () => createGradientTile(['#AED6F1', '#85C1E2', '#5DADE2', '#3498DB']), author: 'Artist_Alex', delay: 71500 },
  { tileId: 48, pattern: () => createGradientTile(['#85C1E2', '#5DADE2', '#3498DB', '#2E86C1']), author: 'Artist_Riley', delay: 73000 },
  { tileId: 49, pattern: () => createGradientTile(['#5DADE2', '#3498DB', '#2E86C1', '#21618C']), author: 'Artist_Casey', delay: 74500 },

  // Community gathering - warm colors
  { tileId: 50, pattern: () => createDiamondTile('#E74C3C', '#C0392B'), author: 'Artist_Morgan', delay: 76000 },
  { tileId: 51, pattern: () => createCircleTile('#F39C12', '#E67E22'), author: 'Artist_Taylor', delay: 77500 },
  { tileId: 52, pattern: () => createDiamondTile('#E67E22', '#D35400'), author: 'Artist_Avery', delay: 79000 },
  { tileId: 53, pattern: () => createCircleTile('#F1C40F', '#F39C12'), author: 'Artist_Quinn', delay: 80500 },
  { tileId: 54, pattern: () => createDiamondTile('#F39C12', '#E74C3C'), author: 'Artist_River', delay: 82000 },
  { tileId: 55, pattern: () => createCircleTile('#E74C3C', '#C0392B'), author: 'Artist_Sky', delay: 83500 },
  { tileId: 56, pattern: () => createDiamondTile('#E67E22', '#D35400'), author: 'Artist_Blake', delay: 85000 },
  { tileId: 57, pattern: () => createCircleTile('#F39C12', '#E67E22'), author: 'Artist_Drew', delay: 86500 },
  { tileId: 58, pattern: () => createDiamondTile('#F1C40F', '#F39C12'), author: 'Artist_Phoenix', delay: 88000 },
  { tileId: 59, pattern: () => createCircleTile('#E74C3C', '#E67E22'), author: 'Artist_Eden', delay: 89500 },

  // Cultural patterns - purple and pink
  { tileId: 60, pattern: () => createGradientTile(['#9B59B6', '#8E44AD', '#7D3C98', '#6C3483']), author: 'Artist_Finn', delay: 91000 },
  { tileId: 61, pattern: () => createCheckerTile('#A569BD', '#7D3C98'), author: 'Artist_Harper', delay: 92500 },
  { tileId: 62, pattern: () => createGradientTile(['#8E44AD', '#7D3C98', '#6C3483', '#5B2C6F']), author: 'Artist_Rowan', delay: 94000 },
  { tileId: 63, pattern: () => createCheckerTile('#7D3C98', '#6C3483'), author: 'Artist_Maya', delay: 95500 },
  { tileId: 64, pattern: () => createGradientTile(['#7D3C98', '#6C3483', '#5B2C6F', '#4A235A']), author: 'Artist_Sam', delay: 97000 },
  { tileId: 65, pattern: () => createCheckerTile('#A569BD', '#8E44AD'), author: 'Artist_Kai', delay: 98500 },
  { tileId: 66, pattern: () => createGradientTile(['#6C3483', '#5B2C6F', '#4A235A', '#5B2C6F']), author: 'Artist_Jamie', delay: 100000 },
  { tileId: 67, pattern: () => createCheckerTile('#7D3C98', '#5B2C6F'), author: 'Artist_Parker', delay: 101500 },
  { tileId: 68, pattern: () => createGradientTile(['#5B2C6F', '#4A235A', '#5B2C6F', '#6C3483']), author: 'Artist_Jordan', delay: 103000 },
  { tileId: 69, pattern: () => createCheckerTile('#8E44AD', '#7D3C98'), author: 'Artist_Alex', delay: 104500 },

  // Connection pathways - yellow and orange
  { tileId: 70, pattern: () => createCircleTile('#F1C40F', '#F39C12'), author: 'Artist_Riley', delay: 106000 },
  { tileId: 71, pattern: () => createDiamondTile('#F39C12', '#E67E22'), author: 'Artist_Casey', delay: 107500 },
  { tileId: 72, pattern: () => createCircleTile('#E67E22', '#D35400'), author: 'Artist_Morgan', delay: 109000 },
  { tileId: 73, pattern: () => createDiamondTile('#F1C40F', '#F39C12'), author: 'Artist_Taylor', delay: 110500 },
  { tileId: 74, pattern: () => createCircleTile('#F39C12', '#E67E22'), author: 'Artist_Avery', delay: 112000 },
  { tileId: 75, pattern: () => createDiamondTile('#E67E22', '#D35400'), author: 'Artist_Quinn', delay: 113500 },
  { tileId: 76, pattern: () => createCircleTile('#F1C40F', '#F39C12'), author: 'Artist_River', delay: 115000 },
  { tileId: 77, pattern: () => createDiamondTile('#F39C12', '#E67E22'), author: 'Artist_Sky', delay: 116500 },
  { tileId: 78, pattern: () => createCircleTile('#E67E22', '#D35400'), author: 'Artist_Blake', delay: 118000 },
  { tileId: 79, pattern: () => createDiamondTile('#F1C40F', '#E67E22'), author: 'Artist_Drew', delay: 119500 },

  // Unity section - multi-color harmony
  { tileId: 80, pattern: () => createCircleTile('#E74C3C', '#3498DB'), author: 'Artist_Phoenix', delay: 121000 },
  { tileId: 81, pattern: () => createDiamondTile('#3498DB', '#2ECC71'), author: 'Artist_Eden', delay: 122500 },
  { tileId: 82, pattern: () => createCircleTile('#2ECC71', '#F39C12'), author: 'Artist_Finn', delay: 124000 },
  { tileId: 83, pattern: () => createDiamondTile('#F39C12', '#9B59B6'), author: 'Artist_Harper', delay: 125500 },
  { tileId: 84, pattern: () => createCircleTile('#9B59B6', '#E74C3C'), author: 'Artist_Rowan', delay: 127000 },
  { tileId: 85, pattern: () => createDiamondTile('#E74C3C', '#3498DB'), author: 'Artist_Maya', delay: 128500 },
  { tileId: 86, pattern: () => createCircleTile('#3498DB', '#2ECC71'), author: 'Artist_Sam', delay: 130000 },
  { tileId: 87, pattern: () => createDiamondTile('#2ECC71', '#F39C12'), author: 'Artist_Kai', delay: 131500 },
  { tileId: 88, pattern: () => createCircleTile('#F39C12', '#9B59B6'), author: 'Artist_Jamie', delay: 133000 },
  { tileId: 89, pattern: () => createDiamondTile('#9B59B6', '#E74C3C'), author: 'Artist_Parker', delay: 134500 },

  // Bottom row - cool sunset blend
  { tileId: 90, pattern: () => createGradientTile(['#8E44AD', '#9B59B6', '#A569BD', '#BB8FCE']), author: 'Artist_Jordan', delay: 136000 },
  { tileId: 91, pattern: () => createGradientTile(['#9B59B6', '#A569BD', '#BB8FCE', '#D7BDE2']), author: 'Artist_Alex', delay: 137500 },
  { tileId: 92, pattern: () => createGradientTile(['#A569BD', '#BB8FCE', '#D7BDE2', '#E8DAEF']), author: 'Artist_Riley', delay: 139000 },
  { tileId: 93, pattern: () => createGradientTile(['#BB8FCE', '#D7BDE2', '#E8DAEF', '#F4ECF7']), author: 'Artist_Casey', delay: 140500 },
  { tileId: 94, pattern: () => createGradientTile(['#D7BDE2', '#E8DAEF', '#F4ECF7', '#E8DAEF']), author: 'Artist_Morgan', delay: 142000 },
  { tileId: 95, pattern: () => createGradientTile(['#E8DAEF', '#F4ECF7', '#E8DAEF', '#D7BDE2']), author: 'Artist_Taylor', delay: 143500 },
  { tileId: 96, pattern: () => createGradientTile(['#F4ECF7', '#E8DAEF', '#D7BDE2', '#BB8FCE']), author: 'Artist_Avery', delay: 145000 },
  { tileId: 97, pattern: () => createGradientTile(['#E8DAEF', '#D7BDE2', '#BB8FCE', '#A569BD']), author: 'Artist_Quinn', delay: 146500 },
  { tileId: 98, pattern: () => createGradientTile(['#D7BDE2', '#BB8FCE', '#A569BD', '#9B59B6']), author: 'Artist_River', delay: 148000 },
  { tileId: 99, pattern: () => createGradientTile(['#BB8FCE', '#A569BD', '#9B59B6', '#8E44AD']), author: 'Artist_Sky', delay: 149500 },
];

const { tiles: societalTiles, history: societalHistory } = createPresetMosaic(societalPatterns, baseTime);
const societalGallery = {
  id: 'societal-murals',
  name: 'Societal Murals',
  theme: 'societal',
  description: 'Community-created art representing urban life, nature, and unity',
  tiles: societalTiles,
  history: societalHistory,
  challenge: null,
  createdAt: baseTime,
  lastActivity: baseTime + 150000
};

galleries.set('societal-murals', societalGallery);

// Create Nature & Wildlife preset gallery
const natureBaseTime = Date.now() - (20 * 60 * 60 * 1000); // 20 hours ago
const naturePatterns = [
  // Sky gradient - top row
  { tileId: 0, pattern: () => createGradientTile(['#87CEEB', '#87CEEB', '#B0E0E6', '#E0F6FF']), author: 'Artist_Luna', delay: 1000 },
  { tileId: 1, pattern: () => createGradientTile(['#87CEEB', '#B0E0E6', '#E0F6FF', '#F0F8FF']), author: 'Artist_Willow', delay: 2000 },
  { tileId: 2, pattern: () => createGradientTile(['#B0E0E6', '#E0F6FF', '#F0F8FF', '#E0F6FF']), author: 'Artist_Aspen', delay: 3000 },
  { tileId: 3, pattern: () => createGradientTile(['#E0F6FF', '#F0F8FF', '#FFFAF0', '#FFF8DC']), author: 'Artist_Cedar', delay: 4000 },
  { tileId: 4, pattern: () => createCircleTile('#FFD700', '#87CEEB'), author: 'Artist_Maple', delay: 5000 },
  { tileId: 5, pattern: () => createGradientTile(['#F0F8FF', '#FFFAF0', '#FFF8DC', '#FFEFD5']), author: 'Artist_Oak', delay: 6000 },
  { tileId: 6, pattern: () => createGradientTile(['#E0F6FF', '#F0F8FF', '#E0F6FF', '#B0E0E6']), author: 'Artist_Pine', delay: 7000 },
  { tileId: 7, pattern: () => createGradientTile(['#F0F8FF', '#E0F6FF', '#B0E0E6', '#87CEEB']), author: 'Artist_Birch', delay: 8000 },
  { tileId: 8, pattern: () => createGradientTile(['#B0E0E6', '#87CEEB', '#87CEEB', '#6CA6CD']), author: 'Artist_Rowan', delay: 9000 },
  { tileId: 9, pattern: () => createCircleTile('#FFFFFF', '#87CEEB'), author: 'Artist_Sage', delay: 10000 },

  // Mountain peaks
  { tileId: 10, pattern: () => createDiamondTile('#D3D3D3', '#87CEEB'), author: 'Artist_Stone', delay: 11500 },
  { tileId: 11, pattern: () => createDiamondTile('#A9A9A9', '#B0C4DE'), author: 'Artist_Cliff', delay: 12500 },
  { tileId: 12, pattern: () => createCircleTile('#FFFFFF', '#A9A9A9'), author: 'Artist_Peak', delay: 13500 },
  { tileId: 13, pattern: () => createDiamondTile('#DCDCDC', '#B0C4DE'), author: 'Artist_Ridge', delay: 14500 },
  { tileId: 14, pattern: () => createDiamondTile('#C0C0C0', '#87CEEB'), author: 'Artist_Summit', delay: 15500 },
  { tileId: 15, pattern: () => createCircleTile('#FFFAFA', '#DCDCDC'), author: 'Artist_Alpine', delay: 16500 },
  { tileId: 16, pattern: () => createDiamondTile('#D3D3D3', '#B0C4DE'), author: 'Artist_Frost', delay: 17500 },
  { tileId: 17, pattern: () => createDiamondTile('#A9A9A9', '#87CEEB'), author: 'Artist_Glacier', delay: 18500 },
  { tileId: 18, pattern: () => createCircleTile('#F0F8FF', '#C0C0C0'), author: 'Artist_Snow', delay: 19500 },
  { tileId: 19, pattern: () => createDiamondTile('#DCDCDC', '#B0C4DE'), author: 'Artist_Ice', delay: 20500 },

  // Forest canopy
  { tileId: 20, pattern: () => createSolidTile('#228B22'), author: 'Artist_Forest', delay: 22000 },
  { tileId: 21, pattern: () => createCheckerTile('#2E8B57', '#228B22'), author: 'Artist_Woods', delay: 23000 },
  { tileId: 22, pattern: () => createCircleTile('#90EE90', '#2E8B57'), author: 'Artist_Grove', delay: 24000 },
  { tileId: 23, pattern: () => createSolidTile('#2E8B57'), author: 'Artist_Thicket', delay: 25000 },
  { tileId: 24, pattern: () => createCheckerTile('#228B22', '#006400'), author: 'Artist_Canopy', delay: 26000 },
  { tileId: 25, pattern: () => createCircleTile('#9ACD32', '#228B22'), author: 'Artist_Leaf', delay: 27000 },
  { tileId: 26, pattern: () => createSolidTile('#006400'), author: 'Artist_Fern', delay: 28000 },
  { tileId: 27, pattern: () => createCheckerTile('#2E8B57', '#006400'), author: 'Artist_Moss', delay: 29000 },
  { tileId: 28, pattern: () => createCircleTile('#ADFF2F', '#2E8B57'), author: 'Artist_Vine', delay: 30000 },
  { tileId: 29, pattern: () => createSolidTile('#228B22'), author: 'Artist_Branch', delay: 31000 },

  // Wildlife - deer and birds
  { tileId: 30, pattern: () => createCircleTile('#8B4513', '#228B22'), author: 'Artist_Deer', delay: 32500 },
  { tileId: 31, pattern: () => createDiamondTile('#D2691E', '#2E8B57'), author: 'Artist_Fawn', delay: 33500 },
  { tileId: 32, pattern: () => createCircleTile('#CD853F', '#228B22'), author: 'Artist_Buck', delay: 34500 },
  { tileId: 33, pattern: () => createCircleTile('#4169E1', '#2E8B57'), author: 'Artist_Bluejay', delay: 35500 },
  { tileId: 34, pattern: () => createDiamondTile('#DC143C', '#228B22'), author: 'Artist_Cardinal', delay: 36500 },
  { tileId: 35, pattern: () => createCircleTile('#FFD700', '#2E8B57'), author: 'Artist_Finch', delay: 37500 },
  { tileId: 36, pattern: () => createCircleTile('#FF6347', '#228B22'), author: 'Artist_Robin', delay: 38500 },
  { tileId: 37, pattern: () => createDiamondTile('#8B4513', '#2E8B57'), author: 'Artist_Owl', delay: 39500 },
  { tileId: 38, pattern: () => createCircleTile('#000000', '#228B22'), author: 'Artist_Crow', delay: 40500 },
  { tileId: 39, pattern: () => createCircleTile('#DEB887', '#2E8B57'), author: 'Artist_Sparrow', delay: 41500 },

  // Meadow flowers
  { tileId: 40, pattern: () => createCircleTile('#FF69B4', '#90EE90'), author: 'Artist_Rose', delay: 43000 },
  { tileId: 41, pattern: () => createCircleTile('#FFD700', '#7CFC00'), author: 'Artist_Sunflower', delay: 44000 },
  { tileId: 42, pattern: () => createCircleTile('#FF1493', '#98FB98'), author: 'Artist_Daisy', delay: 45000 },
  { tileId: 43, pattern: () => createCircleTile('#9370DB', '#90EE90'), author: 'Artist_Lavender', delay: 46000 },
  { tileId: 44, pattern: () => createCircleTile('#FF6347', '#7CFC00'), author: 'Artist_Poppy', delay: 47000 },
  { tileId: 45, pattern: () => createCircleTile('#4169E1', '#98FB98'), author: 'Artist_Bluebell', delay: 48000 },
  { tileId: 46, pattern: () => createCircleTile('#FFFF00', '#90EE90'), author: 'Artist_Daffodil', delay: 49000 },
  { tileId: 47, pattern: () => createCircleTile('#FF69B4', '#7CFC00'), author: 'Artist_Tulip', delay: 50000 },
  { tileId: 48, pattern: () => createCircleTile('#BA55D3', '#98FB98'), author: 'Artist_Orchid', delay: 51000 },
  { tileId: 49, pattern: () => createCircleTile('#FFA500', '#90EE90'), author: 'Artist_Marigold', delay: 52000 },

  // Grass and earth
  { tileId: 50, pattern: () => createGradientTile(['#7CFC00', '#ADFF2F', '#7FFF00', '#00FF00']), author: 'Artist_Meadow', delay: 53500 },
  { tileId: 51, pattern: () => createGradientTile(['#ADFF2F', '#7FFF00', '#00FF00', '#32CD32']), author: 'Artist_Prairie', delay: 54500 },
  { tileId: 52, pattern: () => createGradientTile(['#7FFF00', '#00FF00', '#32CD32', '#00FA9A']), author: 'Artist_Field', delay: 55500 },
  { tileId: 53, pattern: () => createGradientTile(['#00FF00', '#32CD32', '#00FA9A', '#3CB371']), author: 'Artist_Plain', delay: 56500 },
  { tileId: 54, pattern: () => createGradientTile(['#32CD32', '#00FA9A', '#3CB371', '#2E8B57']), author: 'Artist_Pasture', delay: 57500 },
  { tileId: 55, pattern: () => createGradientTile(['#00FA9A', '#3CB371', '#2E8B57', '#228B22']), author: 'Artist_Lawn', delay: 58500 },
  { tileId: 56, pattern: () => createGradientTile(['#3CB371', '#2E8B57', '#228B22', '#006400']), author: 'Artist_Turf', delay: 59500 },
  { tileId: 57, pattern: () => createGradientTile(['#2E8B57', '#228B22', '#006400', '#228B22']), author: 'Artist_Green', delay: 60500 },
  { tileId: 58, pattern: () => createGradientTile(['#228B22', '#006400', '#228B22', '#2E8B57']), author: 'Artist_Sward', delay: 61500 },
  { tileId: 59, pattern: () => createGradientTile(['#006400', '#228B22', '#2E8B57', '#3CB371']), author: 'Artist_Blade', delay: 62500 },

  // River/water
  { tileId: 60, pattern: () => createGradientTile(['#1E90FF', '#00BFFF', '#87CEEB', '#B0E0E6']), author: 'Artist_River', delay: 64000 },
  { tileId: 61, pattern: () => createGradientTile(['#00BFFF', '#87CEEB', '#B0E0E6', '#ADD8E6']), author: 'Artist_Stream', delay: 65000 },
  { tileId: 62, pattern: () => createGradientTile(['#87CEEB', '#B0E0E6', '#ADD8E6', '#E0F6FF']), author: 'Artist_Brook', delay: 66000 },
  { tileId: 63, pattern: () => createCircleTile('#FFFFFF', '#87CEEB'), author: 'Artist_Rapids', delay: 67000 },
  { tileId: 64, pattern: () => createGradientTile(['#B0E0E6', '#ADD8E6', '#E0F6FF', '#F0F8FF']), author: 'Artist_Current', delay: 68000 },
  { tileId: 65, pattern: () => createCircleTile('#E0FFFF', '#87CEEB'), author: 'Artist_Ripple', delay: 69000 },
  { tileId: 66, pattern: () => createGradientTile(['#ADD8E6', '#E0F6FF', '#F0F8FF', '#E0F6FF']), author: 'Artist_Flow', delay: 70000 },
  { tileId: 67, pattern: () => createGradientTile(['#E0F6FF', '#F0F8FF', '#E0F6FF', '#ADD8E6']), author: 'Artist_Wave', delay: 71000 },
  { tileId: 68, pattern: () => createGradientTile(['#F0F8FF', '#E0F6FF', '#ADD8E6', '#B0E0E6']), author: 'Artist_Splash', delay: 72000 },
  { tileId: 69, pattern: () => createCircleTile('#F0FFFF', '#87CEEB'), author: 'Artist_Cascade', delay: 73000 },

  // Butterflies and insects
  { tileId: 70, pattern: () => createDiamondTile('#FF8C00', '#7CFC00'), author: 'Artist_Monarch', delay: 74500 },
  { tileId: 71, pattern: () => createDiamondTile('#4169E1', '#90EE90'), author: 'Artist_Blue', delay: 75500 },
  { tileId: 72, pattern: () => createCircleTile('#FFD700', '#98FB98'), author: 'Artist_Bee', delay: 76500 },
  { tileId: 73, pattern: () => createDiamondTile('#FF1493', '#7CFC00'), author: 'Artist_Pink', delay: 77500 },
  { tileId: 74, pattern: () => createCircleTile('#000000', '#FFFF00'), author: 'Artist_Bumble', delay: 78500 },
  { tileId: 75, pattern: () => createDiamondTile('#9370DB', '#90EE90'), author: 'Artist_Purple', delay: 79500 },
  { tileId: 76, pattern: () => createCircleTile('#FF6347', '#98FB98'), author: 'Artist_Lady', delay: 80500 },
  { tileId: 77, pattern: () => createDiamondTile('#32CD32', '#7CFC00'), author: 'Artist_Green', delay: 81500 },
  { tileId: 78, pattern: () => createCircleTile('#87CEEB', '#90EE90'), author: 'Artist_Dragonfly', delay: 82500 },
  { tileId: 79, pattern: () => createDiamondTile('#FFD700', '#98FB98'), author: 'Artist_Yellow', delay: 83500 },

  // Ground/soil
  { tileId: 80, pattern: () => createSolidTile('#8B4513'), author: 'Artist_Earth', delay: 85000 },
  { tileId: 81, pattern: () => createCheckerTile('#A0522D', '#8B4513'), author: 'Artist_Soil', delay: 86000 },
  { tileId: 82, pattern: () => createSolidTile('#A0522D'), author: 'Artist_Dirt', delay: 87000 },
  { tileId: 83, pattern: () => createCheckerTile('#8B4513', '#654321'), author: 'Artist_Ground', delay: 88000 },
  { tileId: 84, pattern: () => createSolidTile('#654321'), author: 'Artist_Clay', delay: 89000 },
  { tileId: 85, pattern: () => createCheckerTile('#A0522D', '#654321'), author: 'Artist_Loam', delay: 90000 },
  { tileId: 86, pattern: () => createSolidTile('#8B4513'), author: 'Artist_Humus', delay: 91000 },
  { tileId: 87, pattern: () => createCheckerTile('#654321', '#A0522D'), author: 'Artist_Peat', delay: 92000 },
  { tileId: 88, pattern: () => createSolidTile('#A0522D'), author: 'Artist_Sand', delay: 93000 },
  { tileId: 89, pattern: () => createCheckerTile('#8B4513', '#A0522D'), author: 'Artist_Silt', delay: 94000 },

  // Mushrooms and fungi
  { tileId: 90, pattern: () => createCircleTile('#FF6347', '#8B4513'), author: 'Artist_Toadstool', delay: 95500 },
  { tileId: 91, pattern: () => createCircleTile('#F5DEB3', '#A0522D'), author: 'Artist_Mushroom', delay: 96500 },
  { tileId: 92, pattern: () => createCircleTile('#DEB887', '#8B4513'), author: 'Artist_Fungus', delay: 97500 },
  { tileId: 93, pattern: () => createCircleTile('#CD853F', '#654321'), author: 'Artist_Morel', delay: 98500 },
  { tileId: 94, pattern: () => createCircleTile('#FFFFFF', '#8B4513'), author: 'Artist_Puffball', delay: 99500 },
  { tileId: 95, pattern: () => createCircleTile('#FFE4B5', '#A0522D'), author: 'Artist_Chanterelle', delay: 100500 },
  { tileId: 96, pattern: () => createCircleTile('#F0E68C', '#8B4513'), author: 'Artist_Oyster', delay: 101500 },
  { tileId: 97, pattern: () => createCircleTile('#D2691E', '#654321'), author: 'Artist_Shiitake', delay: 102500 },
  { tileId: 98, pattern: () => createCircleTile('#BC8F8F', '#A0522D'), author: 'Artist_Portobello', delay: 103500 },
  { tileId: 99, pattern: () => createCircleTile('#8B7355', '#8B4513'), author: 'Artist_Truffle', delay: 104500 },
];

const { tiles: natureTiles, history: natureHistory } = createPresetMosaic(naturePatterns, natureBaseTime);
const natureGallery = {
  id: 'nature',
  name: 'Nature & Wildlife',
  theme: 'nature',
  description: 'Create natural landscapes and wildlife',
  tiles: natureTiles,
  history: natureHistory,
  challenge: null,
  createdAt: natureBaseTime,
  lastActivity: natureBaseTime + 105000
};

// Create Cosmic Dreams (Space) preset gallery
const spaceBaseTime = Date.now() - (15 * 60 * 60 * 1000); // 15 hours ago
const spacePatterns = [
  // Deep space
  { tileId: 0, pattern: () => createSolidTile('#000000'), author: 'Artist_Cosmos', delay: 1000 },
  { tileId: 1, pattern: () => createSolidTile('#0A0A1A'), author: 'Artist_Void', delay: 2000 },
  { tileId: 2, pattern: () => createCircleTile('#FFFFFF', '#000000'), author: 'Artist_Star', delay: 3000 },
  { tileId: 3, pattern: () => createSolidTile('#000000'), author: 'Artist_Darkness', delay: 4000 },
  { tileId: 4, pattern: () => createCircleTile('#FFD700', '#0A0A1A'), author: 'Artist_Nova', delay: 5000 },
  { tileId: 5, pattern: () => createSolidTile('#0A0A1A'), author: 'Artist_Abyss', delay: 6000 },
  { tileId: 6, pattern: () => createCircleTile('#F0F8FF', '#000000'), author: 'Artist_Twinkle', delay: 7000 },
  { tileId: 7, pattern: () => createSolidTile('#000000'), author: 'Artist_Night', delay: 8000 },
  { tileId: 8, pattern: () => createCircleTile('#FFFACD', '#0A0A1A'), author: 'Artist_Pulsar', delay: 9000 },
  { tileId: 9, pattern: () => createSolidTile('#0A0A1A'), author: 'Artist_Shadow', delay: 10000 },

  // Purple nebula
  { tileId: 10, pattern: () => createGradientTile(['#4B0082', '#8B00FF', '#9370DB', '#BA55D3']), author: 'Artist_Nebula', delay: 11500 },
  { tileId: 11, pattern: () => createGradientTile(['#8B00FF', '#9370DB', '#BA55D3', '#DDA0DD']), author: 'Artist_Cloud', delay: 12500 },
  { tileId: 12, pattern: () => createGradientTile(['#9370DB', '#BA55D3', '#DDA0DD', '#EE82EE']), author: 'Artist_Mist', delay: 13500 },
  { tileId: 13, pattern: () => createCircleTile('#FF1493', '#9370DB'), author: 'Artist_Pink', delay: 14500 },
  { tileId: 14, pattern: () => createGradientTile(['#BA55D3', '#DDA0DD', '#EE82EE', '#DDA0DD']), author: 'Artist_Violet', delay: 15500 },
  { tileId: 15, pattern: () => createCircleTile('#FFFFFF', '#8B00FF'), author: 'Artist_Bright', delay: 16500 },
  { tileId: 16, pattern: () => createGradientTile(['#DDA0DD', '#EE82EE', '#DDA0DD', '#BA55D3']), author: 'Artist_Haze', delay: 17500 },
  { tileId: 17, pattern: () => createGradientTile(['#EE82EE', '#DDA0DD', '#BA55D3', '#9370DB']), author: 'Artist_Plume', delay: 18500 },
  { tileId: 18, pattern: () => createCircleTile('#FFD700', '#9370DB'), author: 'Artist_Gold', delay: 19500 },
  { tileId: 19, pattern: () => createGradientTile(['#DDA0DD', '#BA55D3', '#9370DB', '#8B00FF']), author: 'Artist_Mauve', delay: 20500 },

  // Galaxy core
  { tileId: 20, pattern: () => createCircleTile('#FFD700', '#4B0082'), author: 'Artist_Core', delay: 22000 },
  { tileId: 21, pattern: () => createDiamondTile('#FFA500', '#8B00FF'), author: 'Artist_Center', delay: 23000 },
  { tileId: 22, pattern: () => createCircleTile('#FFFF00', '#4B0082'), author: 'Artist_Heart', delay: 24000 },
  { tileId: 23, pattern: () => createDiamondTile('#FFD700', '#9370DB'), author: 'Artist_Nucleus', delay: 25000 },
  { tileId: 24, pattern: () => createCircleTile('#FFA500', '#8B00FF'), author: 'Artist_Hub', delay: 26000 },
  { tileId: 25, pattern: () => createDiamondTile('#FFFF00', '#4B0082'), author: 'Artist_Middle', delay: 27000 },
  { tileId: 26, pattern: () => createCircleTile('#FFD700', '#9370DB'), author: 'Artist_Focal', delay: 28000 },
  { tileId: 27, pattern: () => createDiamondTile('#FFA500', '#8B00FF'), author: 'Artist_Axis', delay: 29000 },
  { tileId: 28, pattern: () => createCircleTile('#FFFF00', '#4B0082'), author: 'Artist_Point', delay: 30000 },
  { tileId: 29, pattern: () => createDiamondTile('#FFD700', '#9370DB'), author: 'Artist_Pivot', delay: 31000 },

  // Blue gas clouds
  { tileId: 30, pattern: () => createGradientTile(['#000080', '#0000CD', '#4169E1', '#1E90FF']), author: 'Artist_Azure', delay: 32500 },
  { tileId: 31, pattern: () => createGradientTile(['#0000CD', '#4169E1', '#1E90FF', '#00BFFF']), author: 'Artist_Cyan', delay: 33500 },
  { tileId: 32, pattern: () => createGradientTile(['#4169E1', '#1E90FF', '#00BFFF', '#87CEEB']), author: 'Artist_Cerulean', delay: 34500 },
  { tileId: 33, pattern: () => createCircleTile('#FFFFFF', '#1E90FF'), author: 'Artist_Ice', delay: 35500 },
  { tileId: 34, pattern: () => createGradientTile(['#1E90FF', '#00BFFF', '#87CEEB', '#B0E0E6']), author: 'Artist_Aqua', delay: 36500 },
  { tileId: 35, pattern: () => createCircleTile('#E0FFFF', '#00BFFF'), author: 'Artist_Frost', delay: 37500 },
  { tileId: 36, pattern: () => createGradientTile(['#00BFFF', '#87CEEB', '#B0E0E6', '#ADD8E6']), author: 'Artist_Sky', delay: 38500 },
  { tileId: 37, pattern: () => createGradientTile(['#87CEEB', '#B0E0E6', '#ADD8E6', '#E0F6FF']), author: 'Artist_Powder', delay: 39500 },
  { tileId: 38, pattern: () => createCircleTile('#F0FFFF', '#87CEEB'), author: 'Artist_Pale', delay: 40500 },
  { tileId: 39, pattern: () => createGradientTile(['#B0E0E6', '#ADD8E6', '#E0F6FF', '#F0F8FF']), author: 'Artist_Light', delay: 41500 },

  // Planets
  { tileId: 40, pattern: () => createCircleTile('#FF4500', '#000000'), author: 'Artist_Mars', delay: 43000 },
  { tileId: 41, pattern: () => createCircleTile('#FFD700', '#0A0A1A'), author: 'Artist_Venus', delay: 44000 },
  { tileId: 42, pattern: () => createCircleTile('#0000FF', '#000000'), author: 'Artist_Neptune', delay: 45000 },
  { tileId: 43, pattern: () => createCircleTile('#FFA500', '#0A0A1A'), author: 'Artist_Jupiter', delay: 46000 },
  { tileId: 44, pattern: () => createCircleTile('#F4A460', '#000000'), author: 'Artist_Saturn', delay: 47000 },
  { tileId: 45, pattern: () => createCircleTile('#4682B4', '#0A0A1A'), author: 'Artist_Uranus', delay: 48000 },
  { tileId: 46, pattern: () => createCircleTile('#8B4513', '#000000'), author: 'Artist_Mercury', delay: 49000 },
  { tileId: 47, pattern: () => createCircleTile('#228B22', '#0A0A1A'), author: 'Artist_Earth', delay: 50000 },
  { tileId: 48, pattern: () => createCircleTile('#696969', '#000000'), author: 'Artist_Pluto', delay: 51000 },
  { tileId: 49, pattern: () => createCircleTile('#DC143C', '#0A0A1A'), author: 'Artist_Exo', delay: 52000 },

  // Red nebula
  { tileId: 50, pattern: () => createGradientTile(['#8B0000', '#DC143C', '#FF6347', '#FF7F50']), author: 'Artist_Crimson', delay: 53500 },
  { tileId: 51, pattern: () => createGradientTile(['#DC143C', '#FF6347', '#FF7F50', '#FFA07A']), author: 'Artist_Scarlet', delay: 54500 },
  { tileId: 52, pattern: () => createGradientTile(['#FF6347', '#FF7F50', '#FFA07A', '#FFB6C1']), author: 'Artist_Coral', delay: 55500 },
  { tileId: 53, pattern: () => createCircleTile('#FFFFFF', '#FF6347'), author: 'Artist_White', delay: 56500 },
  { tileId: 54, pattern: () => createGradientTile(['#FF7F50', '#FFA07A', '#FFB6C1', '#FFC0CB']), author: 'Artist_Rose', delay: 57500 },
  { tileId: 55, pattern: () => createCircleTile('#FFD700', '#FF7F50'), author: 'Artist_Amber', delay: 58500 },
  { tileId: 56, pattern: () => createGradientTile(['#FFA07A', '#FFB6C1', '#FFC0CB', '#FFE4E1']), author: 'Artist_Blush', delay: 59500 },
  { tileId: 57, pattern: () => createGradientTile(['#FFB6C1', '#FFC0CB', '#FFE4E1', '#FFF0F5']), author: 'Artist_Misty', delay: 60500 },
  { tileId: 58, pattern: () => createCircleTile('#F0F8FF', '#FFB6C1'), author: 'Artist_Wisp', delay: 61500 },
  { tileId: 59, pattern: () => createGradientTile(['#FFC0CB', '#FFE4E1', '#FFF0F5', '#FFFAFA']), author: 'Artist_Faint', delay: 62500 },

  // Asteroid belt
  { tileId: 60, pattern: () => createCircleTile('#808080', '#000000'), author: 'Artist_Rock', delay: 64000 },
  { tileId: 61, pattern: () => createDiamondTile('#A9A9A9', '#0A0A1A'), author: 'Artist_Stone', delay: 65000 },
  { tileId: 62, pattern: () => createCircleTile('#696969', '#000000'), author: 'Artist_Boulder', delay: 66000 },
  { tileId: 63, pattern: () => createDiamondTile('#778899', '#0A0A1A'), author: 'Artist_Chunk', delay: 67000 },
  { tileId: 64, pattern: () => createCircleTile('#C0C0C0', '#000000'), author: 'Artist_Meteor', delay: 68000 },
  { tileId: 65, pattern: () => createDiamondTile('#DCDCDC', '#0A0A1A'), author: 'Artist_Debris', delay: 69000 },
  { tileId: 66, pattern: () => createCircleTile('#808080', '#000000'), author: 'Artist_Fragment', delay: 70000 },
  { tileId: 67, pattern: () => createDiamondTile('#A9A9A9', '#0A0A1A'), author: 'Artist_Piece', delay: 71000 },
  { tileId: 68, pattern: () => createCircleTile('#696969', '#000000'), author: 'Artist_Shard', delay: 72000 },
  { tileId: 69, pattern: () => createDiamondTile('#778899', '#0A0A1A'), author: 'Artist_Bit', delay: 73000 },

  // Green aurora
  { tileId: 70, pattern: () => createGradientTile(['#006400', '#228B22', '#32CD32', '#90EE90']), author: 'Artist_Aurora', delay: 74500 },
  { tileId: 71, pattern: () => createGradientTile(['#228B22', '#32CD32', '#90EE90', '#98FB98']), author: 'Artist_Glow', delay: 75500 },
  { tileId: 72, pattern: () => createGradientTile(['#32CD32', '#90EE90', '#98FB98', '#AFEEEE']), author: 'Artist_Shimmer', delay: 76500 },
  { tileId: 73, pattern: () => createCircleTile('#00FF00', '#32CD32'), author: 'Artist_Lime', delay: 77500 },
  { tileId: 74, pattern: () => createGradientTile(['#90EE90', '#98FB98', '#AFEEEE', '#E0FFFF']), author: 'Artist_Gleam', delay: 78500 },
  { tileId: 75, pattern: () => createCircleTile('#7FFFD4', '#90EE90'), author: 'Artist_Aquamarine', delay: 79500 },
  { tileId: 76, pattern: () => createGradientTile(['#98FB98', '#AFEEEE', '#E0FFFF', '#F0FFFF']), author: 'Artist_Radiance', delay: 80500 },
  { tileId: 77, pattern: () => createGradientTile(['#AFEEEE', '#E0FFFF', '#F0FFFF', '#E0FFFF']), author: 'Artist_Luminous', delay: 81500 },
  { tileId: 78, pattern: () => createCircleTile('#00FFFF', '#AFEEEE'), author: 'Artist_Cyan', delay: 82500 },
  { tileId: 79, pattern: () => createGradientTile(['#E0FFFF', '#F0FFFF', '#E0FFFF', '#AFEEEE']), author: 'Artist_Sparkle', delay: 83500 },

  // Cosmic dust
  { tileId: 80, pattern: () => createCheckerTile('#2F4F4F', '#000000'), author: 'Artist_Dust', delay: 85000 },
  { tileId: 81, pattern: () => createCheckerTile('#000000', '#2F4F4F'), author: 'Artist_Particle', delay: 86000 },
  { tileId: 82, pattern: () => createCheckerTile('#2F4F4F', '#0A0A1A'), author: 'Artist_Grain', delay: 87000 },
  { tileId: 83, pattern: () => createCheckerTile('#0A0A1A', '#2F4F4F'), author: 'Artist_Speck', delay: 88000 },
  { tileId: 84, pattern: () => createCheckerTile('#2F4F4F', '#000000'), author: 'Artist_Mote', delay: 89000 },
  { tileId: 85, pattern: () => createCheckerTile('#000000', '#2F4F4F'), author: 'Artist_Fleck', delay: 90000 },
  { tileId: 86, pattern: () => createCheckerTile('#2F4F4F', '#0A0A1A'), author: 'Artist_Atom', delay: 91000 },
  { tileId: 87, pattern: () => createCheckerTile('#0A0A1A', '#2F4F4F'), author: 'Artist_Molecule', delay: 92000 },
  { tileId: 88, pattern: () => createCheckerTile('#2F4F4F', '#000000'), author: 'Artist_Element', delay: 93000 },
  { tileId: 89, pattern: () => createCheckerTile('#000000', '#2F4F4F'), author: 'Artist_Matter', delay: 94000 },

  // Star clusters
  { tileId: 90, pattern: () => createCircleTile('#FFFFFF', '#000000'), author: 'Artist_Cluster', delay: 95500 },
  { tileId: 91, pattern: () => createCircleTile('#FFFACD', '#0A0A1A'), author: 'Artist_Group', delay: 96500 },
  { tileId: 92, pattern: () => createCircleTile('#F0E68C', '#000000'), author: 'Artist_Bunch', delay: 97500 },
  { tileId: 93, pattern: () => createCircleTile('#FFD700', '#0A0A1A'), author: 'Artist_Array', delay: 98500 },
  { tileId: 94, pattern: () => createCircleTile('#FFFFE0', '#000000'), author: 'Artist_Set', delay: 99500 },
  { tileId: 95, pattern: () => createCircleTile('#FAFAD2', '#0A0A1A'), author: 'Artist_Collection', delay: 100500 },
  { tileId: 96, pattern: () => createCircleTile('#F5F5DC', '#000000'), author: 'Artist_Assembly', delay: 101500 },
  { tileId: 97, pattern: () => createCircleTile('#FFF8DC', '#0A0A1A'), author: 'Artist_Gathering', delay: 102500 },
  { tileId: 98, pattern: () => createCircleTile('#FFFFF0', '#000000'), author: 'Artist_Swarm', delay: 103500 },
  { tileId: 99, pattern: () => createCircleTile('#FFFAF0', '#0A0A1A'), author: 'Artist_Multitude', delay: 104500 },
];

const { tiles: spaceTiles, history: spaceHistory } = createPresetMosaic(spacePatterns, spaceBaseTime);
const spaceGallery = {
  id: 'space',
  name: 'Cosmic Dreams',
  theme: 'space',
  description: 'Explore the cosmos through art',
  tiles: spaceTiles,
  history: spaceHistory,
  challenge: null,
  createdAt: spaceBaseTime,
  lastActivity: spaceBaseTime + 105000
};

// Create Abstract Expressions preset gallery
const abstractBaseTime = Date.now() - (10 * 60 * 60 * 1000); // 10 hours ago
const abstractPatterns = [
  // Bold geometric patterns
  { tileId: 0, pattern: () => createDiamondTile('#FF0000', '#000000'), author: 'Artist_Bold', delay: 1000 },
  { tileId: 1, pattern: () => createCheckerTile('#FFFF00', '#0000FF'), author: 'Artist_Contrast', delay: 2000 },
  { tileId: 2, pattern: () => createDiamondTile('#00FF00', '#FF00FF'), author: 'Artist_Vivid', delay: 3000 },
  { tileId: 3, pattern: () => createCheckerTile('#FF00FF', '#00FFFF'), author: 'Artist_Bright', delay: 4000 },
  { tileId: 4, pattern: () => createDiamondTile('#FFA500', '#4B0082'), author: 'Artist_Sharp', delay: 5000 },
  { tileId: 5, pattern: () => createCheckerTile('#00FFFF', '#FF0000'), author: 'Artist_Strike', delay: 6000 },
  { tileId: 6, pattern: () => createDiamondTile('#0000FF', '#FFFF00'), author: 'Artist_Clash', delay: 7000 },
  { tileId: 7, pattern: () => createCheckerTile('#FF00FF', '#00FF00'), author: 'Artist_Pop', delay: 8000 },
  { tileId: 8, pattern: () => createDiamondTile('#4B0082', '#FFA500'), author: 'Artist_Punch', delay: 9000 },
  { tileId: 9, pattern: () => createCheckerTile('#FF0000', '#00FFFF'), author: 'Artist_Zap', delay: 10000 },

  // Rainbow spectrum
  { tileId: 10, pattern: () => createGradientTile(['#FF0000', '#FF7F00', '#FFFF00', '#00FF00']), author: 'Artist_Rainbow', delay: 11500 },
  { tileId: 11, pattern: () => createGradientTile(['#FF7F00', '#FFFF00', '#00FF00', '#0000FF']), author: 'Artist_Spectrum', delay: 12500 },
  { tileId: 12, pattern: () => createGradientTile(['#FFFF00', '#00FF00', '#0000FF', '#4B0082']), author: 'Artist_Prism', delay: 13500 },
  { tileId: 13, pattern: () => createGradientTile(['#00FF00', '#0000FF', '#4B0082', '#9400D3']), author: 'Artist_Color', delay: 14500 },
  { tileId: 14, pattern: () => createGradientTile(['#0000FF', '#4B0082', '#9400D3', '#FF0000']), author: 'Artist_Hue', delay: 15500 },
  { tileId: 15, pattern: () => createGradientTile(['#4B0082', '#9400D3', '#FF0000', '#FF7F00']), author: 'Artist_Shade', delay: 16500 },
  { tileId: 16, pattern: () => createGradientTile(['#9400D3', '#FF0000', '#FF7F00', '#FFFF00']), author: 'Artist_Tint', delay: 17500 },
  { tileId: 17, pattern: () => createGradientTile(['#FF0000', '#FF7F00', '#FFFF00', '#00FF00']), author: 'Artist_Tone', delay: 18500 },
  { tileId: 18, pattern: () => createGradientTile(['#FF7F00', '#FFFF00', '#00FF00', '#0000FF']), author: 'Artist_Chroma', delay: 19500 },
  { tileId: 19, pattern: () => createGradientTile(['#FFFF00', '#00FF00', '#0000FF', '#4B0082']), author: 'Artist_Saturation', delay: 20500 },

  // Monochrome patterns
  { tileId: 20, pattern: () => createSolidTile('#000000'), author: 'Artist_Black', delay: 22000 },
  { tileId: 21, pattern: () => createCheckerTile('#000000', '#FFFFFF'), author: 'Artist_Binary', delay: 23000 },
  { tileId: 22, pattern: () => createSolidTile('#FFFFFF'), author: 'Artist_White', delay: 24000 },
  { tileId: 23, pattern: () => createCheckerTile('#FFFFFF', '#000000'), author: 'Artist_Polar', delay: 25000 },
  { tileId: 24, pattern: () => createSolidTile('#808080'), author: 'Artist_Gray', delay: 26000 },
  { tileId: 25, pattern: () => createCheckerTile('#808080', '#C0C0C0'), author: 'Artist_Neutral', delay: 27000 },
  { tileId: 26, pattern: () => createSolidTile('#C0C0C0'), author: 'Artist_Silver', delay: 28000 },
  { tileId: 27, pattern: () => createCheckerTile('#C0C0C0', '#808080'), author: 'Artist_Ash', delay: 29000 },
  { tileId: 28, pattern: () => createSolidTile('#404040'), author: 'Artist_Charcoal', delay: 30000 },
  { tileId: 29, pattern: () => createCheckerTile('#404040', '#DCDCDC'), author: 'Artist_Contrast', delay: 31000 },

  // Warm colors
  { tileId: 30, pattern: () => createCircleTile('#FF0000', '#FFFF00'), author: 'Artist_Fire', delay: 32500 },
  { tileId: 31, pattern: () => createCircleTile('#FFA500', '#FF6347'), author: 'Artist_Flame', delay: 33500 },
  { tileId: 32, pattern: () => createCircleTile('#FF4500', '#FFD700'), author: 'Artist_Ember', delay: 34500 },
  { tileId: 33, pattern: () => createCircleTile('#FF8C00', '#FF7F50'), author: 'Artist_Blaze', delay: 35500 },
  { tileId: 34, pattern: () => createCircleTile('#DC143C', '#FFFF00'), author: 'Artist_Heat', delay: 36500 },
  { tileId: 35, pattern: () => createCircleTile('#FF6347', '#FFA500'), author: 'Artist_Warm', delay: 37500 },
  { tileId: 36, pattern: () => createCircleTile('#FFD700', '#FF4500'), author: 'Artist_Glow', delay: 38500 },
  { tileId: 37, pattern: () => createCircleTile('#FF7F50', '#FF8C00'), author: 'Artist_Radiant', delay: 39500 },
  { tileId: 38, pattern: () => createCircleTile('#FFFF00', '#DC143C'), author: 'Artist_Solar', delay: 40500 },
  { tileId: 39, pattern: () => createCircleTile('#FFA500', '#FF0000'), author: 'Artist_Sunset', delay: 41500 },

  // Cool colors
  { tileId: 40, pattern: () => createCircleTile('#0000FF', '#00FFFF'), author: 'Artist_Ice', delay: 43000 },
  { tileId: 41, pattern: () => createCircleTile('#4169E1', '#1E90FF'), author: 'Artist_Frost', delay: 44000 },
  { tileId: 42, pattern: () => createCircleTile('#00BFFF', '#87CEEB'), author: 'Artist_Chill', delay: 45000 },
  { tileId: 43, pattern: () => createCircleTile('#1E90FF', '#00CED1'), author: 'Artist_Arctic', delay: 46000 },
  { tileId: 44, pattern: () => createCircleTile('#4682B4', '#5F9EA0'), author: 'Artist_Winter', delay: 47000 },
  { tileId: 45, pattern: () => createCircleTile('#00CED1', '#4169E1'), author: 'Artist_Frozen', delay: 48000 },
  { tileId: 46, pattern: () => createCircleTile('#87CEEB', '#0000FF'), author: 'Artist_Glacier', delay: 49000 },
  { tileId: 47, pattern: () => createCircleTile('#5F9EA0', '#00BFFF'), author: 'Artist_Tundra', delay: 50000 },
  { tileId: 48, pattern: () => createCircleTile('#00FFFF', '#4682B4'), author: 'Artist_Polar', delay: 51000 },
  { tileId: 49, pattern: () => createCircleTile('#1E90FF', '#87CEEB'), author: 'Artist_Crystal', delay: 52000 },

  // Neon colors
  { tileId: 50, pattern: () => createDiamondTile('#FF1493', '#00FF00'), author: 'Artist_Neon', delay: 53500 },
  { tileId: 51, pattern: () => createDiamondTile('#00FF00', '#FF00FF'), author: 'Artist_Electric', delay: 54500 },
  { tileId: 52, pattern: () => createDiamondTile('#FF00FF', '#00FFFF'), author: 'Artist_Fluorescent', delay: 55500 },
  { tileId: 53, pattern: () => createDiamondTile('#00FFFF', '#FFFF00'), author: 'Artist_Vivid', delay: 56500 },
  { tileId: 54, pattern: () => createDiamondTile('#FFFF00', '#FF1493'), author: 'Artist_Brilliant', delay: 57500 },
  { tileId: 55, pattern: () => createDiamondTile('#FF1493', '#00FF00'), author: 'Artist_Luminous', delay: 58500 },
  { tileId: 56, pattern: () => createDiamondTile('#00FF00', '#FF00FF'), author: 'Artist_Glowing', delay: 59500 },
  { tileId: 57, pattern: () => createDiamondTile('#FF00FF', '#00FFFF'), author: 'Artist_Radiant', delay: 60500 },
  { tileId: 58, pattern: () => createDiamondTile('#00FFFF', '#FFFF00'), author: 'Artist_Bright', delay: 61500 },
  { tileId: 59, pattern: () => createDiamondTile('#FFFF00', '#FF1493'), author: 'Artist_Shiny', delay: 62500 },

  // Pastel colors
  { tileId: 60, pattern: () => createCircleTile('#FFB6C1', '#E0FFFF'), author: 'Artist_Pastel', delay: 64000 },
  { tileId: 61, pattern: () => createCircleTile('#FFE4E1', '#F0E68C'), author: 'Artist_Soft', delay: 65000 },
  { tileId: 62, pattern: () => createCircleTile('#F0E68C', '#E6E6FA'), author: 'Artist_Gentle', delay: 66000 },
  { tileId: 63, pattern: () => createCircleTile('#E6E6FA', '#FFB6C1'), author: 'Artist_Delicate', delay: 67000 },
  { tileId: 64, pattern: () => createCircleTile('#E0FFFF', '#FFE4E1'), author: 'Artist_Pale', delay: 68000 },
  { tileId: 65, pattern: () => createCircleTile('#FFB6C1', '#F0E68C'), author: 'Artist_Light', delay: 69000 },
  { tileId: 66, pattern: () => createCircleTile('#FFE4E1', '#E6E6FA'), author: 'Artist_Muted', delay: 70000 },
  { tileId: 67, pattern: () => createCircleTile('#F0E68C', '#E0FFFF'), author: 'Artist_Subtle', delay: 71000 },
  { tileId: 68, pattern: () => createCircleTile('#E6E6FA', '#FFE4E1'), author: 'Artist_Faint', delay: 72000 },
  { tileId: 69, pattern: () => createCircleTile('#E0FFFF', '#FFB6C1'), author: 'Artist_Tender', delay: 73000 },

  // Earth tones
  { tileId: 70, pattern: () => createSolidTile('#8B4513'), author: 'Artist_Earth', delay: 74500 },
  { tileId: 71, pattern: () => createCheckerTile('#A0522D', '#8B4513'), author: 'Artist_Soil', delay: 75500 },
  { tileId: 72, pattern: () => createSolidTile('#CD853F'), author: 'Artist_Sand', delay: 76500 },
  { tileId: 73, pattern: () => createCheckerTile('#DEB887', '#CD853F'), author: 'Artist_Tan', delay: 77500 },
  { tileId: 74, pattern: () => createSolidTile('#D2691E'), author: 'Artist_Clay', delay: 78500 },
  { tileId: 75, pattern: () => createCheckerTile('#BC8F8F', '#D2691E'), author: 'Artist_Adobe', delay: 79500 },
  { tileId: 76, pattern: () => createSolidTile('#F4A460'), author: 'Artist_Desert', delay: 80500 },
  { tileId: 77, pattern: () => createCheckerTile('#DAA520', '#F4A460'), author: 'Artist_Dune', delay: 81500 },
  { tileId: 78, pattern: () => createSolidTile('#B8860B'), author: 'Artist_Ochre', delay: 82500 },
  { tileId: 79, pattern: () => createCheckerTile('#CD853F', '#B8860B'), author: 'Artist_Sienna', delay: 83500 },

  // Jewel tones
  { tileId: 80, pattern: () => createDiamondTile('#E0115F', '#4B0082'), author: 'Artist_Ruby', delay: 85000 },
  { tileId: 81, pattern: () => createDiamondTile('#50C878', '#0F52BA'), author: 'Artist_Emerald', delay: 86000 },
  { tileId: 82, pattern: () => createDiamondTile('#0F52BA', '#9966CC'), author: 'Artist_Sapphire', delay: 87000 },
  { tileId: 83, pattern: () => createDiamondTile('#9966CC', '#E0115F'), author: 'Artist_Amethyst', delay: 88000 },
  { tileId: 84, pattern: () => createDiamondTile('#00A86B', '#50C878'), author: 'Artist_Jade', delay: 89000 },
  { tileId: 85, pattern: () => createDiamondTile('#DA70D6', '#0F52BA'), author: 'Artist_Orchid', delay: 90000 },
  { tileId: 86, pattern: () => createDiamondTile('#40E0D0', '#9966CC'), author: 'Artist_Turquoise', delay: 91000 },
  { tileId: 87, pattern: () => createDiamondTile('#FFD700', '#E0115F'), author: 'Artist_Gold', delay: 92000 },
  { tileId: 88, pattern: () => createDiamondTile('#FF7F50', '#00A86B'), author: 'Artist_Coral', delay: 93000 },
  { tileId: 89, pattern: () => createDiamondTile('#6A5ACD', '#40E0D0'), author: 'Artist_Slate', delay: 94000 },

  // Metallic
  { tileId: 90, pattern: () => createCircleTile('#C0C0C0', '#808080'), author: 'Artist_Silver', delay: 95500 },
  { tileId: 91, pattern: () => createCircleTile('#FFD700', '#B8860B'), author: 'Artist_Gold', delay: 96500 },
  { tileId: 92, pattern: () => createCircleTile('#B87333', '#8B4513'), author: 'Artist_Bronze', delay: 97500 },
  { tileId: 93, pattern: () => createCircleTile('#E5E4E2', '#C0C0C0'), author: 'Artist_Platinum', delay: 98500 },
  { tileId: 94, pattern: () => createCircleTile('#B76E79', '#CD7F32'), author: 'Artist_Copper', delay: 99500 },
  { tileId: 95, pattern: () => createCircleTile('#A8A9AD', '#71706E'), author: 'Artist_Chrome', delay: 100500 },
  { tileId: 96, pattern: () => createCircleTile('#E1C16E', '#DAA520'), author: 'Artist_Brass', delay: 101500 },
  { tileId: 97, pattern: () => createCircleTile('#6D7F8D', '#5F7279'), author: 'Artist_Steel', delay: 102500 },
  { tileId: 98, pattern: () => createCircleTile('#F5F5DC', '#E5E4E2'), author: 'Artist_Pearl', delay: 103500 },
  { tileId: 99, pattern: () => createCircleTile('#D4AF37', '#CFB53B'), author: 'Artist_Gilded', delay: 104500 },
];

const { tiles: abstractTiles, history: abstractHistory } = createPresetMosaic(abstractPatterns, abstractBaseTime);
const abstractGallery = {
  id: 'abstract',
  name: 'Abstract Expressions',
  theme: 'abstract',
  description: 'Pure color and form',
  tiles: abstractTiles,
  history: abstractHistory,
  challenge: null,
  createdAt: abstractBaseTime,
  lastActivity: abstractBaseTime + 105000
};

// Update existing galleries with preset data
galleries.set('nature', natureGallery);
galleries.set('space', spaceGallery);
galleries.set('abstract', abstractGallery);

// Template storage
export const templates = new Map();

// Add some basic templates
templates.set('rainbow-grid', {
  name: 'Rainbow Grid',
  description: 'A colorful rainbow pattern to get started',
  theme: 'abstract',
  tiles: new Map()
});

templates.set('sunset', {
  name: 'Sunset Gradient',
  description: 'Warm sunset colors',
  theme: 'nature',
  tiles: new Map()
});

// Track connected users per gallery
const userGalleries = new Map(); // socket.id -> galleryId
let connectedUsers = new Set();

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  connectedUsers.add(socket.id);
  userGalleries.set(socket.id, 'main'); // Default gallery

  // Broadcast updated user count
  io.emit('user-count', connectedUsers.size);

  // Send available galleries
  socket.emit('galleries-list', Array.from(galleries.values()).map(g => ({
    id: g.id,
    name: g.name,
    theme: g.theme,
    description: g.description,
    tileCount: Array.from(g.tiles.values()).filter(t => t.author).length,
    challenge: g.challenge,
    createdAt: g.createdAt,
    lastActivity: g.lastActivity
  })));

  // Join gallery
  socket.on('join-gallery', (galleryId) => {
    const gallery = galleries.get(galleryId);

    if (!gallery) {
      socket.emit('error', { message: 'Gallery not found' });
      return;
    }

    userGalleries.set(socket.id, galleryId);
    socket.join(galleryId);

    // Send current gallery state
    socket.emit('initial-tiles', {
      galleryId,
      tiles: Array.from(gallery.tiles.entries()).map(([id, data]) => ({
        id,
        ...data
      })),
      metadata: {
        name: gallery.name,
        theme: gallery.theme,
        description: gallery.description,
        challenge: gallery.challenge
      }
    });

    console.log(`User ${socket.id} joined gallery: ${galleryId}`);
  });

  // Handle tile updates
  socket.on('update-tile', (data) => {
    const { galleryId, tileId, pixels, author } = data;
    const gallery = galleries.get(galleryId);

    if (!gallery || tileId < 0 || tileId >= 100) {
      return;
    }

    const tileUpdate = {
      pixels,
      author: author || socket.id,
      timestamp: Date.now()
    };

    gallery.tiles.set(tileId, tileUpdate);
    gallery.lastActivity = Date.now();

    // Add to history for time-lapse
    gallery.history.push({
      tileId,
      ...tileUpdate
    });

    // Broadcast to all users in this gallery
    io.to(galleryId).emit('tile-updated', {
      galleryId,
      tileId,
      ...tileUpdate
    });

    console.log(`Tile ${tileId} updated in gallery ${galleryId} by ${author || socket.id}`);
  });

  // Get time-lapse data
  socket.on('get-timelapse', (galleryId) => {
    const gallery = galleries.get(galleryId);

    if (gallery) {
      socket.emit('timelapse-data', {
        galleryId,
        history: gallery.history
      });
    }
  });

  // Create new gallery
  socket.on('create-gallery', (data) => {
    const { name, theme, description, template } = data;
    const galleryId = `gallery-${Date.now()}`;

    const newGallery = createGallery(galleryId, name, theme, description, template);
    galleries.set(galleryId, newGallery);

    // Broadcast new gallery to all users
    io.emit('gallery-created', {
      id: newGallery.id,
      name: newGallery.name,
      theme: newGallery.theme,
      description: newGallery.description,
      tileCount: 0,
      createdAt: newGallery.createdAt
    });

    socket.emit('gallery-created-success', { galleryId });
  });

  // Vote on challenge submission
  socket.on('vote-tile', (data) => {
    const { galleryId, tileId } = data;
    const gallery = galleries.get(galleryId);

    if (gallery && gallery.challenge) {
      if (!gallery.challenge.votes) {
        gallery.challenge.votes = new Map();
      }

      const currentVotes = gallery.challenge.votes.get(tileId) || 0;
      gallery.challenge.votes.set(tileId, currentVotes + 1);

      io.to(galleryId).emit('vote-updated', {
        galleryId,
        tileId,
        votes: currentVotes + 1
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    connectedUsers.delete(socket.id);
    userGalleries.delete(socket.id);
    io.emit('user-count', connectedUsers.size);
  });
});

// REST API routes
app.use('/api', tilesRouter);

// Get all galleries
app.get('/api/galleries', (req, res) => {
  const galleriesList = Array.from(galleries.values()).map(g => ({
    id: g.id,
    name: g.name,
    theme: g.theme,
    description: g.description,
    tileCount: Array.from(g.tiles.values()).filter(t => t.author).length,
    challenge: g.challenge,
    createdAt: g.createdAt,
    lastActivity: g.lastActivity
  }));

  res.json({ success: true, galleries: galleriesList });
});

// Get templates
app.get('/api/templates', (req, res) => {
  const templatesList = Array.from(templates.entries()).map(([id, template]) => ({
    id,
    name: template.name,
    description: template.description,
    theme: template.theme
  }));

  res.json({ success: true, templates: templatesList });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    galleries: galleries.size,
    users: connectedUsers.size
  });
});

// Export io for use in routes
export { io };

httpServer.listen(PORT, () => {
  console.log(`🎨 Tesserae server running on port ${PORT}`);
  console.log(`📚 ${galleries.size} galleries initialized`);
});
