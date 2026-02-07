import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Extract dominant colors from a tile's pixel array
 * @param {Array<Array<string>>} pixels - 16x16 pixel array
 * @returns {Array<string>} - Array of dominant colors
 */
function extractDominantColors(pixels) {
  if (!pixels || pixels.length === 0) return [];

  const colorCounts = {};

  pixels.forEach(row => {
    row.forEach(color => {
      if (color && color !== '#FFFFFF') {
        colorCounts[color] = (colorCounts[color] || 0) + 1;
      }
    });
  });

  // Sort by frequency and get top 5
  return Object.entries(colorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([color]) => color);
}

// Art style prompts for different themes
const artStylePrompts = {
  freestyle: 'general color harmony',
  nature: 'natural earth tones, greens, blues, and organic colors inspired by landscapes and wildlife',
  space: 'cosmic colors including deep purples, blues, star whites, and nebula-inspired gradients',
  abstract: 'bold, experimental colors with high contrast and artistic freedom',
  impressionist: 'soft, light colors with visible brushwork aesthetic - pastels, light blues, pinks, and yellows',
  artdeco: 'geometric patterns with gold, black, white, and jewel tones',
  popart: 'bright, saturated primary colors with high contrast - reds, yellows, blues, and blacks',
  renaissance: 'rich, deep colors - burgundy, deep blues, golds, and earth tones',
  cyberpunk: 'neon colors - hot pinks, electric blues, toxic greens against dark backgrounds',
  minimalist: 'limited palette with whites, blacks, grays, and one accent color'
};

/**
 * Use Groq API to suggest complementary colors based on adjacent tiles and art style
 * @param {number} tileId - The tile ID (0-99)
 * @param {Array} adjacentTileData - Array of {id, pixels} for neighboring tiles
 * @param {string} artStyle - The art style/theme to follow
 * @returns {Promise<Array<string>>} - Array of 5 suggested hex colors
 */
export async function suggestColors(tileId, adjacentTileData, artStyle = 'freestyle') {
  try {
    // Extract colors from adjacent tiles
    const adjacentColors = adjacentTileData
      .filter(tile => tile.pixels && tile.pixels.length > 0)
      .map(tile => ({
        id: tile.id,
        colors: extractDominantColors(tile.pixels)
      }))
      .filter(tile => tile.colors.length > 0);

    // Fallback palette if no adjacent colors or API fails
    const fallbackColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];

    // If no adjacent tiles have colors, return fallback
    if (adjacentColors.length === 0) {
      return fallbackColors;
    }

    // Prepare context for AI
    const colorContext = adjacentColors.map(tile =>
      `Tile ${tile.id}: ${tile.colors.join(', ')}`
    ).join('\n');

    const styleGuide = artStylePrompts[artStyle] || artStylePrompts.freestyle;

    const prompt = `You are a color theory expert helping with a collaborative pixel art mosaic in the style of "${artStyle}".

${colorContext ? `Adjacent tiles have these dominant colors:\n${colorContext}\n` : 'This is a fresh canvas with no adjacent colors yet.\n'}
Art Style: ${styleGuide}

Suggest 5 complementary hex colors that would harmonize well with the theme while ${colorContext ? 'coordinating with adjacent tiles' : 'establishing the artistic direction'}. Consider:
- Color harmony (complementary, analogous, or triadic relationships)
- The specific aesthetic of ${artStyle} style
- Visual cohesion ${colorContext ? 'with neighbors' : 'for starting the mosaic'}
- Variety to avoid monotony
- Aesthetic appeal for pixel art

Return ONLY 5 hex color codes, one per line, nothing else. Example format:
#FF6B6B
#4ECDC4
#45B7D1
#FFA07A
#98D8C8`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{
        role: 'user',
        content: prompt
      }],
      max_tokens: 200,
      temperature: 0.7
    });

    // Parse the response
    const responseText = completion.choices[0]?.message?.content || '';
    const colorMatches = responseText.match(/#[0-9A-Fa-f]{6}/g);

    if (colorMatches && colorMatches.length >= 5) {
      return colorMatches.slice(0, 5);
    }

    // If parsing fails, return fallback
    console.warn('AI response did not contain valid colors, using fallback');
    return fallbackColors;

  } catch (error) {
    console.error('Error in AI color suggestion:', error.message);
    // Return fallback colors on error
    return ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];
  }
}
