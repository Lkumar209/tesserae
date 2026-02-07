import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import './TileGrid.css';

const GRID_SIZE = 10; // 10x10 grid
const TILE_SIZE = 16; // 16x16 pixels per tile

function TileGrid({ tiles, onTileClick, showHeatmap, currentUser }) {
  const [hoveredTile, setHoveredTile] = useState(null);

  // Calculate contribution counts per author for heatmap
  const getContributionCount = (author) => {
    if (!author) return 0;
    return tiles.filter(t => t.author === author).length;
  };

  const getHeatmapIntensity = (author) => {
    if (!showHeatmap || !author) return 0;
    const count = getContributionCount(author);
    const maxCount = Math.max(...tiles.map(t => getContributionCount(t.author)), 1);
    return count / maxCount;
  };

  // Render a single tile
  const renderTile = (tileId) => {
    const tile = tiles.find(t => t.id === tileId);
    const pixels = tile?.pixels;
    const author = tile?.author;
    const isEmpty = !author;
    const isCurrentUser = author === currentUser;

    return (
      <motion.div
        key={tileId}
        className={`tile ${isEmpty ? 'empty' : 'filled'} ${isCurrentUser ? 'own-tile' : ''}`}
        onClick={() => onTileClick(tileId)}
        onMouseEnter={() => setHoveredTile(tileId)}
        onMouseLeave={() => setHoveredTile(null)}
        whileHover={{ scale: 1.05, zIndex: 10 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, delay: tileId * 0.005 }}
      >
        {pixels && (
          <canvas
            ref={(canvas) => {
              if (canvas && pixels) {
                const ctx = canvas.getContext('2d');
                const scale = 50 / TILE_SIZE;

                for (let y = 0; y < TILE_SIZE; y++) {
                  for (let x = 0; x < TILE_SIZE; x++) {
                    ctx.fillStyle = pixels[y]?.[x] || '#FFFFFF';
                    ctx.fillRect(x * scale, y * scale, scale, scale);
                  }
                }
              }
            }}
            width={50}
            height={50}
            className="tile-canvas"
          />
        )}

        {/* Heatmap overlay */}
        {showHeatmap && author && (
          <div
            className="heatmap-overlay"
            style={{
              opacity: getHeatmapIntensity(author) * 0.7
            }}
          />
        )}

        {/* Empty tile indicator */}
        {isEmpty && (
          <div className="empty-indicator">
            <Plus size={20} strokeWidth={2} />
          </div>
        )}

        {/* Current user indicator */}
        {isCurrentUser && !isEmpty && (
          <div className="user-indicator" />
        )}
      </motion.div>
    );
  };

  return (
    <div className="tile-grid-container">
      <motion.div
        className="tile-grid glass-card"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => renderTile(i))}
      </motion.div>
    </div>
  );
}

export default TileGrid;
