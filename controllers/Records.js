const express = require('express');
const RecordsRouter = express.Router();
const { jwtMiddleware, profileJwtMiddleware } = require('../utils/middleware');
const { upload, isValidObjectId } = require('../utils/helper');
const logger = require('../utils/logger');
const RecordsService = require('../services/RecordsService');

// Get all albums for a user
RecordsRouter.get('/:userId/albums', async (req, res, next) => {
    try {
        const { userId } = req.params;
   

        if (!isValidObjectId(userId)) {
            return res.status(400).json({ message: 'Invalid User ID' });
        }

        const records = await RecordsService.getUserRecords(userId);
        res.json(records);
    } catch (error) {
        next(error);
    }
});

RecordsRouter.get('/:userId/albums/:albumId', async (req, res, next) => {
    try {
        const { userId, albumId } = req.params;

        const records = await RecordsService.getAlbum(userId, albumId);
        res.json(records);
    } catch (error) {
        next(error);
    }
});

// Create a new album
RecordsRouter.post('/:userId/albums', profileJwtMiddleware, async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Album name is required' });
        }

        const records = await RecordsService.createAlbum(userId, name);
        res.status(201).json(records);
    } catch (error) {
        next(error);
    }
});

// Add photos to an album
RecordsRouter.post('/:userId/albums/:albumId/photos', profileJwtMiddleware, upload.single('photo'), async (req, res, next) => {
    try {
        const { userId, albumId } = req.params;
        if (!req.file) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        const records = await RecordsService.addPhotoToAlbum(userId, albumId, req.file);
        res.json(records);
    } catch (error) {
        next(error);
    }
});

// Delete an album
RecordsRouter.delete('/:userId/albums/:albumId', profileJwtMiddleware, async (req, res, next) => {
    try {
        const { userId, albumId } = req.params;
        const { gUserID } = req;

        if (gUserID !== userId) {
            return res.status(401).json({ error: 'You are not authorized to perform this action' });
        }

        await RecordsService.deleteAlbum(userId, albumId);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

// Delete a photo from an album
RecordsRouter.delete('/:userId/albums/:albumId/photos/:photoKey', profileJwtMiddleware, async (req, res, next) => {
    try {
        const { userId, albumId, photoKey } = req.params;
        const { gUserID } = req;

        if (gUserID !== userId) {
            return res.status(401).json({ error: 'You are not authorized to perform this action' });
        }

        await RecordsService.deletePhotoFromAlbum(userId, albumId, photoKey);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

// Edit album name
RecordsRouter.put('/:userId/albums/:albumId', profileJwtMiddleware, async (req, res, next) => {
    try {
        const { userId, albumId } = req.params;
        const { name } = req.body;
        const { gUserID } = req;

        if (gUserID !== userId) {
            return res.status(401).json({ error: 'You are not authorized to perform this action' });
        }

        if (!name) {
            return res.status(400).json({ message: 'Album name is required' });
        }

        const records = await RecordsService.editAlbum(userId, albumId, name);
        res.json(records);
    } catch (error) {
        next(error);
    }
});

// Edit photo (replace with new photo)
RecordsRouter.put('/:userId/albums/:albumId/photos/:photoKey', profileJwtMiddleware, upload.single('photo'), async (req, res, next) => {
    try {
        const { userId, albumId, photoKey } = req.params;
        const { gUserID } = req;

        if (gUserID !== userId) {
            return res.status(401).json({ error: 'You are not authorized to perform this action' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        const records = await RecordsService.editPhoto(userId, albumId, photoKey, req.file);
        res.json(records);
    } catch (error) {
        next(error);
    }
});

// Get recent photos from all albums
RecordsRouter.get('/recent-photos', jwtMiddleware, async (request, response, next) => {
  const userId = request.gUserID;

  try {
    // Find all albums for the user
    const albums = await RecordsService.getUserRecords(userId);
    
    // Log the entire albums array for inspection
    logger.info('Albums retrieved:', JSON.stringify(albums, null, 2));
    console.log('Albums retrieved:', albums);

    // Collect all photos from all albums
    const allPhotos = albums.flatMap(album => album.photos || []);

    // Log the collected photos
    logger.info('All Photos:', JSON.stringify(allPhotos, null, 2));
    console.log('All Photos:', allPhotos);

    // Return the recent photos
    response.status(200).json({ 
      memories: allPhotos
        .sort((a, b) => new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0))
        .slice(0, 6)
        .map(photo => ({ image: photo.url }))
    });
  } catch (error) {
    logger.error('Error fetching recent photos:', error);
    next(error);
  }
});

module.exports = RecordsRouter;