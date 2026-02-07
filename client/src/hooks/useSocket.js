import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [userCount, setUserCount] = useState(0);
  const [galleries, setGalleries] = useState([]);
  const [currentGalleryId, setCurrentGalleryId] = useState('main');
  const [tiles, setTiles] = useState([]);
  const [galleryMetadata, setGalleryMetadata] = useState(null);
  const [timelapseHistory, setTimelapseHistory] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling']
    });

    const socket = socketRef.current;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);

      // Join default gallery
      socket.emit('join-gallery', currentGalleryId);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    // User count updates
    socket.on('user-count', (count) => {
      setUserCount(count);
    });

    // Galleries list
    socket.on('galleries-list', (galleriesList) => {
      console.log('Received galleries:', galleriesList.length);
      setGalleries(galleriesList);
    });

    // New gallery created
    socket.on('gallery-created', (gallery) => {
      setGalleries(prev => [...prev, gallery]);
    });

    // Initial tiles data for a gallery
    socket.on('initial-tiles', (data) => {
      console.log('Received initial tiles for gallery:', data.galleryId);
      setTiles(data.tiles || []);
      setGalleryMetadata(data.metadata || null);
    });

    // Tile update events
    socket.on('tile-updated', (data) => {
      const { galleryId, tileId, pixels, author, timestamp } = data;

      // Only update if it's for the current gallery
      if (galleryId === currentGalleryId) {
        setTiles((prevTiles) => {
          const newTiles = [...prevTiles];
          const tileIndex = newTiles.findIndex(t => t.id === tileId);

          if (tileIndex !== -1) {
            newTiles[tileIndex] = {
              ...newTiles[tileIndex],
              pixels,
              author,
              timestamp
            };
          } else {
            newTiles.push({ id: tileId, pixels, author, timestamp });
          }

          return newTiles;
        });
      }
    });

    // Time-lapse data
    socket.on('timelapse-data', (data) => {
      console.log('Received timelapse data:', data.history.length, 'frames');
      setTimelapseHistory(data.history || []);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, [currentGalleryId]);

  // Join a different gallery
  const joinGallery = (galleryId) => {
    if (socketRef.current && socketRef.current.connected) {
      setCurrentGalleryId(galleryId);
      socketRef.current.emit('join-gallery', galleryId);
    }
  };

  // Create new gallery
  const createGallery = (galleryData) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('create-gallery', galleryData);
    }
  };

  // Update a tile
  const updateTile = (tileId, pixels, author) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('update-tile', {
        galleryId: currentGalleryId,
        tileId,
        pixels,
        author
      });
    }
  };

  // Request timelapse data
  const requestTimelapse = () => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('get-timelapse', currentGalleryId);
    }
  };

  // Vote on a tile
  const voteTile = (tileId) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('vote-tile', {
        galleryId: currentGalleryId,
        tileId
      });
    }
  };

  return {
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
    requestTimelapse,
    voteTile,
    socket: socketRef.current
  };
}
