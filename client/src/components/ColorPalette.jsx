import React, { useState } from 'react';
import './ColorPalette.css';

function ColorPalette({ suggestedColors, currentColor, onColorSelect }) {
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customColor, setCustomColor] = useState('#000000');

  // Default color palette
  const defaultColors = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080'
  ];

  const handleColorClick = (color) => {
    onColorSelect(color);
    setShowCustomPicker(false);
  };

  const handleCustomColorChange = (e) => {
    const color = e.target.value;
    setCustomColor(color);
    onColorSelect(color);
  };

  return (
    <div className="color-palette">
      <div className="palette-section">
        <h3 className="palette-title">AI Suggested Colors</h3>
        <div className="color-row">
          {suggestedColors.length > 0 ? (
            suggestedColors.map((color, index) => (
              <div
                key={`suggested-${index}`}
                className={`color-swatch ${currentColor === color ? 'selected' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => handleColorClick(color)}
                title={color}
              >
                {currentColor === color && <span className="check">✓</span>}
              </div>
            ))
          ) : (
            <div className="loading-text">Loading AI suggestions...</div>
          )}
        </div>
      </div>

      <div className="palette-section">
        <h3 className="palette-title">Basic Colors</h3>
        <div className="color-row">
          {defaultColors.map((color, index) => (
            <div
              key={`default-${index}`}
              className={`color-swatch ${currentColor === color ? 'selected' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => handleColorClick(color)}
              title={color}
            >
              {currentColor === color && (
                <span className="check" style={{ color: color === '#000000' ? 'white' : 'black' }}>
                  ✓
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="palette-section">
        <h3 className="palette-title">Custom Color</h3>
        <div className="custom-color-picker">
          <input
            type="color"
            value={customColor}
            onChange={handleCustomColorChange}
            className="color-input"
          />
          <span className="color-value">{customColor}</span>
        </div>
      </div>

      <div className="current-color-display">
        <div className="current-color-label">Current Color:</div>
        <div className="current-color-box" style={{ backgroundColor: currentColor }}>
          <span className="current-color-text">{currentColor}</span>
        </div>
      </div>
    </div>
  );
}

export default ColorPalette;
