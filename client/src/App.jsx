import React, { useState, useEffect } from 'react';
import {
  Palette, Users, Sparkles, BarChart3,
  LayoutGrid, Timer, Maximize2, Flame, X
} from 'lucide-react';
import { motion } from 'framer-motion';
import TileGrid from './components/TileGrid';
import DrawingCanvas from './components/DrawingCanvas';
import GallerySelector from './components/GallerySelector';
import TimeLapsePlayer from './components/TimeLapsePlayer';
import { useSocket } from './hooks/useSocket';
import './App.css';

function App() {
  const {
    isConnected,
    userCount,
    galleries,
    currentGalleryId,
    tiles,
    galleryMetadata,
    timelapseHistory,
    joinGallery,
    createGallery,
    updateTile,
    requestTimelapse
  } = useSocket();

  const [selectedTileId, setSelectedTileId] = useState(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showReveal, setShowReveal] = useState(false);
  const [showGalleries, setShowGalleries] = useState(false);
  const [showTimelapse, setShowTimelapse] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const randomId = Math.random().toString(36).substring(7);
    setUserName(`Artist_${randomId}`);
  }, []);

  const getContributionCount = () => {
    return tiles.filter(t => t.author === userName).length;
  };

  const getAdjacentTiles = (tileId) => {
    const row = Math.floor(tileId / 10);
    const col = tileId % 10;
    const adjacentIds = [];
    if (row > 0) adjacentIds.push(tileId - 10);
    if (row < 9) adjacentIds.push(tileId + 10);
    if (col > 0) adjacentIds.push(tileId - 1);
    if (col < 9) adjacentIds.push(tileId + 1);
    return adjacentIds;
  };

  const handleTileClick = (tileId) => setSelectedTileId(tileId);
  const handleSaveTile = (pixels) => {
    if (selectedTileId !== null) {
      updateTile(selectedTileId, pixels, userName);
      setSelectedTileId(null);
    }
  };
  const handleCloseTile = () => setSelectedTileId(null);
  const handleRevealToggle = () => setShowReveal(!showReveal);
  const handleGalleriesToggle = () => setShowGalleries(!showGalleries);
  const handleTimelapseOpen = () => {
    requestTimelapse();
    setShowTimelapse(true);
  };
  const handleSelectGallery = (galleryId) => {
    joinGallery(galleryId);
    setShowGalleries(false);
  };

  const selectedTile = tiles.find(t => t.id === selectedTileId);
  const adjacentTileIds = selectedTileId !== null ? getAdjacentTiles(selectedTileId) : [];
  const adjacentTileData = adjacentTileIds
    .map(id => tiles.find(t => t.id === id))
    .filter(t => t && t.pixels);

  const currentGallery = galleries.find(g => g.id === currentGalleryId);

  return (
    <div className="app">
      {/* Header */}
      <motion.header
        className="app-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="header-left">
          <Palette className="brand-icon" size={40} strokeWidth={1.5} />
          <div className="header-text">
            <h1 className="brand-title">Tesserae</h1>
            <p className="brand-tagline">Collaborative Pixel Art Mosaic</p>
          </div>
        </div>

        {galleryMetadata && (
          <div className="header-badges">
            <div className="glass-badge">{currentGallery?.name || galleryMetadata.name}</div>
            <div className="glass-badge-gradient">{galleryMetadata.theme}</div>
          </div>
        )}
      </motion.header>

      {/* Stats Bar */}
      <motion.div
        className="stats-bar glass-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="stat-item">
          <Users size={20} />
          <div className="stat-content">
            <span className="stat-label">ARTISTS ONLINE</span>
            <span className="stat-value">{userCount}</span>
          </div>
        </div>

        <div className="stat-item">
          <Sparkles size={20} />
          <div className="stat-content">
            <span className="stat-label">YOUR TILES</span>
            <span className="stat-value">{getContributionCount()}</span>
          </div>
        </div>

        <div className="stat-item">
          <BarChart3 size={20} />
          <div className="stat-content">
            <span className="stat-label">COMPLETED</span>
            <span className="stat-value">{tiles.filter(t => t.author).length}/100</span>
          </div>
        </div>
      </motion.div>

      {/* Action Controls */}
      <motion.div
        className="action-controls"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <button className="glass-button" onClick={handleGalleriesToggle}>
          <LayoutGrid size={18} />
          <span>{showGalleries ? 'Hide' : 'Browse'} Galleries</span>
        </button>

        <button className="glass-button" onClick={handleTimelapseOpen}>
          <Timer size={18} />
          <span>Time-Lapse</span>
        </button>

        <button className="glass-button" onClick={handleRevealToggle}>
          <Maximize2 size={18} />
          <span>Reveal Mosaic</span>
        </button>

        <button
          className={`glass-button ${showHeatmap ? 'glass-button-active' : ''}`}
          onClick={() => setShowHeatmap(!showHeatmap)}
        >
          <Flame size={18} />
          <span>Heatmap</span>
        </button>
      </motion.div>

      {/* Gallery Selector */}
      {showGalleries && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <GallerySelector
            galleries={galleries}
            currentGalleryId={currentGalleryId}
            onSelectGallery={handleSelectGallery}
            onCreateGallery={createGallery}
          />
        </motion.div>
      )}

      {/* Tile Grid */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <TileGrid
          tiles={tiles}
          onTileClick={handleTileClick}
          showHeatmap={showHeatmap}
          currentUser={userName}
        />
      </motion.div>

      {/* Modals */}
      {selectedTileId !== null && (
        <div className="modal-overlay">
          <DrawingCanvas
            tileId={selectedTileId}
            initialPixels={selectedTile?.pixels}
            onSave={handleSaveTile}
            onClose={handleCloseTile}
            adjacentTiles={adjacentTileData}
          />
        </div>
      )}

      {showTimelapse && (
        <div className="modal-overlay">
          <TimeLapsePlayer
            history={timelapseHistory}
            onClose={() => setShowTimelapse(false)}
          />
        </div>
      )}

      {showReveal && (
        <div className="modal-overlay reveal-modal" onClick={handleRevealToggle}>
          <div className="reveal-content glass-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={handleRevealToggle}>
              <X size={18} />
            </button>
            <h2>Full Mosaic - {currentGallery?.name}</h2>
            <canvas
              ref={(canvas) => {
                if (canvas && tiles.length > 0) {
                  const ctx = canvas.getContext('2d');
                  const tileSize = 16;
                  const gridSize = 10;
                  for (let i = 0; i < 100; i++) {
                    const tile = tiles.find(t => t.id === i);
                    const pixels = tile?.pixels;
                    if (pixels) {
                      const row = Math.floor(i / gridSize);
                      const col = i % gridSize;
                      const offsetX = col * tileSize;
                      const offsetY = row * tileSize;
                      for (let y = 0; y < tileSize; y++) {
                        for (let x = 0; x < tileSize; x++) {
                          ctx.fillStyle = pixels[y]?.[x] || '#FFFFFF';
                          ctx.fillRect(offsetX + x, offsetY + y, 1, 1);
                        }
                      }
                    }
                  }
                }
              }}
              width={160}
              height={160}
              style={{
                width: '640px',
                height: '640px',
                border: '2px solid var(--color-border)',
                imageRendering: 'pixelated',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lift)'
              }}
            />
            <p className="reveal-hint">Click outside to close</p>
          </div>
        </div>
      )}

      {/* Footer */}
      <motion.footer
        className="app-footer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <p className="footer-text">
          <span className="text-gradient">{userName}</span> •
          Browse galleries • Watch time-lapse • Create collaborative art
        </p>
      </motion.footer>
    </div>
  );
}

export default App;
