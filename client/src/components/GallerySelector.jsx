import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Palette, Leaf, Rocket, Shapes, Image, Diamond, Zap,
  Landmark, Binary, Square, LayoutGrid, Plus, X, BarChart3, Trophy, Users
} from 'lucide-react';
import './GallerySelector.css';

const THEME_ICONS = {
  freestyle: Palette,
  nature: Leaf,
  space: Rocket,
  abstract: Shapes,
  impressionist: Image,
  artdeco: Diamond,
  popart: Zap,
  renaissance: Landmark,
  cyberpunk: Binary,
  minimalist: Square,
  societal: Users
};

function GallerySelector({ galleries, currentGalleryId, onSelectGallery, onCreateGallery }) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGallery, setNewGallery] = useState({
    name: '',
    theme: 'freestyle',
    description: ''
  });

  const handleCreate = () => {
    if (newGallery.name.trim()) {
      onCreateGallery(newGallery);
      setNewGallery({ name: '', theme: 'freestyle', description: '' });
      setShowCreateForm(false);
    }
  };

  const getThemeIcon = (theme) => {
    const IconComponent = THEME_ICONS[theme] || Palette;
    return <IconComponent size={24} strokeWidth={1.5} />;
  };

  return (
    <motion.div
      className="gallery-selector glass-panel"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="gallery-selector-header">
        <div className="header-title">
          <LayoutGrid size={20} strokeWidth={1.5} />
          <h2>Galleries</h2>
        </div>
        <button
          className={`glass-button ${showCreateForm ? 'active' : ''}`}
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? <X size={16} /> : <Plus size={16} />}
          <span>{showCreateForm ? 'Cancel' : 'New Gallery'}</span>
        </button>
      </div>

      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            className="create-gallery-form glass-card"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <input
              type="text"
              placeholder="Gallery Name"
              value={newGallery.name}
              onChange={(e) => setNewGallery({ ...newGallery, name: e.target.value })}
              className="glass-input"
            />

            <select
              value={newGallery.theme}
              onChange={(e) => setNewGallery({ ...newGallery, theme: e.target.value })}
              className="glass-input"
            >
              <option value="freestyle">Freestyle</option>
              <option value="nature">Nature & Wildlife</option>
              <option value="space">Cosmic Dreams</option>
              <option value="abstract">Abstract</option>
              <option value="impressionist">Impressionist</option>
              <option value="artdeco">Art Deco</option>
              <option value="popart">Pop Art</option>
              <option value="renaissance">Renaissance</option>
              <option value="cyberpunk">Cyberpunk</option>
              <option value="minimalist">Minimalist</option>
              <option value="societal">Societal</option>
            </select>

            <input
              type="text"
              placeholder="Description (optional)"
              value={newGallery.description}
              onChange={(e) => setNewGallery({ ...newGallery, description: e.target.value })}
              className="glass-input"
            />

            <button className="glass-button-primary" onClick={handleCreate}>
              <Plus size={16} />
              <span>Create Gallery</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="galleries-grid">
        {galleries.map((gallery, index) => {
          const isActive = currentGalleryId === gallery.id;
          return (
            <motion.div
              key={gallery.id}
              className={`gallery-card glass-card-glow ${isActive ? 'active' : ''}`}
              onClick={() => onSelectGallery(gallery.id)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="gallery-icon">
                {getThemeIcon(gallery.theme)}
              </div>
              <div className="gallery-info">
                <h3>{gallery.name}</h3>
                <p className="gallery-description">{gallery.description}</p>
                <div className="gallery-stats">
                  <div className="stat">
                    <BarChart3 size={14} />
                    <span>{gallery.tileCount || 0}/100</span>
                  </div>
                  {gallery.challenge && (
                    <div className="challenge-badge">
                      <Trophy size={14} />
                      <span>Challenge</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

export default GallerySelector;
