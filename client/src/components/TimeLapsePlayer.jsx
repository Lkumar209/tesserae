import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Play, Pause, RotateCcw, Download, Timer } from 'lucide-react';
import './TimeLapsePlayer.css';

function TimeLapsePlayer({ history, onClose }) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(100); // ms per frame
  const canvasRef = useRef(null);
  const TILE_SIZE = 16;
  const GRID_SIZE = 10;

  useEffect(() => {
    renderFrame();
  }, [currentFrame, history]);

  useEffect(() => {
    if (isPlaying && currentFrame < history.length - 1) {
      const timer = setTimeout(() => {
        setCurrentFrame(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timer);
    } else if (currentFrame >= history.length - 1) {
      setIsPlaying(false);
    }
  }, [isPlaying, currentFrame, speed, history]);

  const renderFrame = () => {
    const canvas = canvasRef.current;
    if (!canvas || !history.length) return;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 160, 160);

    // Render all tiles up to current frame
    for (let i = 0; i <= currentFrame; i++) {
      const update = history[i];
      if (!update || !update.pixels) continue;

      const tileId = update.tileId;
      const row = Math.floor(tileId / GRID_SIZE);
      const col = tileId % GRID_SIZE;
      const offsetX = col * TILE_SIZE;
      const offsetY = row * TILE_SIZE;

      for (let y = 0; y < TILE_SIZE; y++) {
        for (let x = 0; x < TILE_SIZE; x++) {
          ctx.fillStyle = update.pixels[y]?.[x] || '#FFFFFF';
          ctx.fillRect(offsetX + x, offsetY + y, 1, 1);
        }
      }
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setCurrentFrame(0);
    setIsPlaying(false);
  };

  const handleSpeedChange = (newSpeed) => {
    setSpeed(newSpeed);
  };

  const exportFrame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `tesserae-timelapse-frame-${currentFrame}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  if (!history || history.length === 0) {
    return (
      <motion.div
        className="timelapse-empty glass-modal"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <p>No history available yet. Start drawing to create a time-lapse!</p>
        <button className="glass-button" onClick={onClose}>Close</button>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="timelapse-player glass-modal"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
    >
      <div className="timelapse-header">
        <h2>
          <Timer size={20} />
          <span>Time-Lapse Player</span>
        </h2>
        <button className="modal-close" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <div className="timelapse-content">
        <div className="canvas-wrapper">
          <canvas
            ref={canvasRef}
            width={160}
            height={160}
            className="timelapse-canvas"
          />
        </div>

        <div className="timelapse-controls">
          <div className="progress-section">
            <div className="progress-info">
              <span>Frame {currentFrame + 1} / {history.length}</span>
              <span>{Math.round((currentFrame / history.length) * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max={history.length - 1}
              value={currentFrame}
              onChange={(e) => setCurrentFrame(parseInt(e.target.value))}
              className="progress-slider"
            />
          </div>

          <div className="playback-controls">
            <button onClick={handleReset} className="glass-button control-btn">
              <RotateCcw size={16} />
              <span>Reset</span>
            </button>
            <button onClick={handlePlayPause} className="glass-button-primary control-btn play-btn">
              {isPlaying ? (
                <>
                  <Pause size={16} />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play size={16} />
                  <span>Play</span>
                </>
              )}
            </button>
            <button onClick={exportFrame} className="glass-button control-btn">
              <Download size={16} />
              <span>Export Frame</span>
            </button>
          </div>

          <div className="speed-controls">
            <span>Speed:</span>
            <button
              className={`speed-btn ${speed === 200 ? 'active' : ''}`}
              onClick={() => handleSpeedChange(200)}
            >
              0.5x
            </button>
            <button
              className={`speed-btn ${speed === 100 ? 'active' : ''}`}
              onClick={() => handleSpeedChange(100)}
            >
              1x
            </button>
            <button
              className={`speed-btn ${speed === 50 ? 'active' : ''}`}
              onClick={() => handleSpeedChange(50)}
            >
              2x
            </button>
            <button
              className={`speed-btn ${speed === 25 ? 'active' : ''}`}
              onClick={() => handleSpeedChange(25)}
            >
              4x
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default TimeLapsePlayer;
