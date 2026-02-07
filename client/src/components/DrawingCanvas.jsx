import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Eraser, Save, Sparkles, AlertCircle } from 'lucide-react';
import ColorPalette from './ColorPalette';
import './DrawingCanvas.css';

const TILE_SIZE = 16; // 16x16 pixels
const PIXEL_SIZE = 20; // Display size of each pixel

function DrawingCanvas({ tileId, initialPixels, onSave, onClose, adjacentTiles }) {
  const canvasRef = useRef(null);
  const [pixels, setPixels] = useState(
    initialPixels || Array(TILE_SIZE).fill(null).map(() => Array(TILE_SIZE).fill('#FFFFFF'))
  );
  const [currentColor, setCurrentColor] = useState('#000000');
  const [isDrawing, setIsDrawing] = useState(false);
  const [suggestedColors, setSuggestedColors] = useState([]);
  const [colorWarning, setColorWarning] = useState('');
  const [brushSize, setBrushSize] = useState(1); // 1x1, 2x2, 3x3, 4x4

  useEffect(() => {
    // Fetch AI-suggested colors based on adjacent tiles
    fetchSuggestedColors();
  }, [tileId, adjacentTiles]);

  useEffect(() => {
    // Redraw canvas when pixels change
    drawCanvas();
  }, [pixels]);

  const fetchSuggestedColors = async () => {
    try {
      const response = await fetch('/api/suggest-colors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tileId,
          adjacentTiles: adjacentTiles || []
        })
      });

      const data = await response.json();
      if (data.success && data.colors) {
        setSuggestedColors(data.colors);
      } else if (data.fallbackColors) {
        setSuggestedColors(data.fallbackColors);
      }
    } catch (error) {
      console.error('Error fetching suggested colors:', error);
      // Use fallback colors
      setSuggestedColors(['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8']);
    }
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Draw pixels
    for (let y = 0; y < TILE_SIZE; y++) {
      for (let x = 0; x < TILE_SIZE; x++) {
        ctx.fillStyle = pixels[y][x];
        ctx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
      }
    }

    // Draw grid
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1;

    for (let i = 0; i <= TILE_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * PIXEL_SIZE, 0);
      ctx.lineTo(i * PIXEL_SIZE, TILE_SIZE * PIXEL_SIZE);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * PIXEL_SIZE);
      ctx.lineTo(TILE_SIZE * PIXEL_SIZE, i * PIXEL_SIZE);
      ctx.stroke();
    }
  };

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const centerX = Math.floor((e.clientX - rect.left) / PIXEL_SIZE);
    const centerY = Math.floor((e.clientY - rect.top) / PIXEL_SIZE);

    const newPixels = pixels.map(row => [...row]);

    // Paint area based on brush size (centered on click)
    const offset = Math.floor(brushSize / 2);

    for (let dy = 0; dy < brushSize; dy++) {
      for (let dx = 0; dx < brushSize; dx++) {
        const x = centerX - offset + dx;
        const y = centerY - offset + dy;

        if (x >= 0 && x < TILE_SIZE && y >= 0 && y < TILE_SIZE) {
          newPixels[y][x] = currentColor;
        }
      }
    }

    setPixels(newPixels);
  };

  const handleMouseDown = (e) => {
    setIsDrawing(true);
    handleCanvasClick(e);
  };

  const handleMouseMove = (e) => {
    if (isDrawing) {
      handleCanvasClick(e);
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    setPixels(Array(TILE_SIZE).fill(null).map(() => Array(TILE_SIZE).fill('#FFFFFF')));
  };

  const handleSave = () => {
    // Check for color clustering
    const warning = checkColorClustering();
    if (warning) {
      setColorWarning(warning);
      // Still allow saving, just warn
      setTimeout(() => setColorWarning(''), 5000);
    }

    onSave(pixels);
  };

  const checkColorClustering = () => {
    // Simple anti-clustering: check if current tile uses same dominant color as 3+ neighbors
    if (!adjacentTiles || adjacentTiles.length === 0) return '';

    const getDominantColor = (tilePixels) => {
      if (!tilePixels) return null;
      const colorCounts = {};

      tilePixels.forEach(row => {
        row.forEach(color => {
          if (color !== '#FFFFFF') {
            colorCounts[color] = (colorCounts[color] || 0) + 1;
          }
        });
      });

      const entries = Object.entries(colorCounts);
      if (entries.length === 0) return null;

      return entries.sort((a, b) => b[1] - a[1])[0][0];
    };

    const myDominant = getDominantColor(pixels);
    if (!myDominant) return '';

    let matchCount = 0;
    adjacentTiles.forEach(adjTile => {
      const adjDominant = getDominantColor(adjTile.pixels);
      if (adjDominant === myDominant) {
        matchCount++;
      }
    });

    if (matchCount >= 3) {
      return `Warning: Your dominant color matches ${matchCount} neighboring tiles. Consider using more variety!`;
    }

    return '';
  };

  return (
    <motion.div
      className="drawing-canvas-container glass-modal"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
    >
      <div className="drawing-header">
        <h2>
          <Sparkles size={20} />
          <span>Draw Tile #{tileId}</span>
        </h2>
        <button className="modal-close" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <div className="drawing-content">
        <div className="canvas-section">
          <canvas
            ref={canvasRef}
            width={TILE_SIZE * PIXEL_SIZE}
            height={TILE_SIZE * PIXEL_SIZE}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="pixel-canvas"
          />
        </div>

        <div className="drawing-controls">
          <div className="brush-size-selector">
            <h3 className="control-title">Brush Size</h3>
            <div className="brush-size-options">
              {[1, 2, 3, 4].map(size => (
                <button
                  key={size}
                  className={`brush-size-btn glass-button ${brushSize === size ? 'active' : ''}`}
                  onClick={() => setBrushSize(size)}
                  title={`${size}x${size} pixels`}
                >
                  <div
                    className="brush-preview"
                    style={{
                      width: `${size * 6}px`,
                      height: `${size * 6}px`,
                      backgroundColor: currentColor
                    }}
                  />
                </button>
              ))}
            </div>
            <div className="brush-info">
              {brushSize}x{brushSize} pixels
            </div>
          </div>

          <ColorPalette
            suggestedColors={suggestedColors}
            currentColor={currentColor}
            onColorSelect={setCurrentColor}
          />

          {colorWarning && (
            <motion.div
              className="color-warning"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AlertCircle size={16} />
              <span>{colorWarning}</span>
            </motion.div>
          )}

          <div className="action-buttons">
            <button className="glass-button" onClick={handleClear}>
              <Eraser size={16} />
              <span>Clear</span>
            </button>
            <button className="glass-button-primary" onClick={handleSave}>
              <Save size={16} />
              <span>Save & Broadcast</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default DrawingCanvas;
