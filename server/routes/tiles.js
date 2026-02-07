import express from 'express';
import { galleries } from '../server.js';
import { suggestColors } from '../services/aiService.js';

const router = express.Router();

// GET /api/tiles - Return all tiles for a gallery
router.get('/tiles/:galleryId?', (req, res) => {
  try {
    const galleryId = req.params.galleryId || 'main';
    const gallery = galleries.get(galleryId);

    if (!gallery) {
      return res.status(404).json({
        success: false,
        error: 'Gallery not found'
      });
    }

    const tilesArray = Array.from(gallery.tiles.entries()).map(([id, data]) => ({
      id,
      pixels: data.pixels,
      author: data.author,
      timestamp: data.timestamp
    }));

    res.json({
      success: true,
      galleryId,
      tiles: tilesArray,
      total: tilesArray.length
    });
  } catch (error) {
    console.error('Error fetching tiles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tiles'
    });
  }
});

// POST /api/suggest-colors - Get AI color suggestions with art style
router.post('/suggest-colors', async (req, res) => {
  try {
    const { galleryId, tileId, adjacentTiles, artStyle } = req.body;

    if (tileId === undefined || tileId < 0 || tileId >= 100) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tile ID'
      });
    }

    const gallery = galleries.get(galleryId || 'main');

    if (!gallery) {
      return res.status(404).json({
        success: false,
        error: 'Gallery not found'
      });
    }

    // Get adjacent tile data from the gallery
    const adjacentTileData = adjacentTiles?.map(id => ({
      id,
      pixels: gallery.tiles.get(id)?.pixels || []
    })) || [];

    // Call AI service for color suggestions with optional art style
    const suggestedColors = await suggestColors(
      tileId,
      adjacentTileData,
      artStyle || gallery.theme
    );

    res.json({
      success: true,
      colors: suggestedColors,
      tileId,
      artStyle: artStyle || gallery.theme
    });
  } catch (error) {
    console.error('Error suggesting colors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to suggest colors',
      fallbackColors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8']
    });
  }
});

export default router;
