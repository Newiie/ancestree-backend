const RecordsRepository = require('../repositories/RecordsRepository');
const ImageService = require('./ImageService');

class RecordsService {
    async createAlbum(userId, albumName) {
        if (!albumName) {
            throw new Error('Album name is required');
        }
        return await RecordsRepository.addAlbum(userId, albumName);
    }

    async createRecord(userId) {
        return await RecordsRepository.createRecord(userId);
    }
    
    async getUserRecords(userId) {
        const records = await RecordsRepository.findRecordsByUserId(userId);
        const { albums } = records;
        const albumsImages = []
        const transformedAlbums = await Promise.all(
            albums.map(async (album) => {
                const transformedPhotos = await this.transformPhotoUrls(album);
                albumsImages.push(transformedPhotos);
                return { ...album.toObject(), photos: transformedPhotos };
            })
        );
    
        return transformedAlbums;
    }

    async getAlbum(userId, albumId) {
        const records = await RecordsRepository.findRecordsByUserId(userId);
        if (!records) {
            throw new Error('Records not found');
        }
        const album = await RecordsRepository.findAlbumById(records, albumId);
        if (!album) {
            throw new Error('Album not found');
        }
        
        // Transform photos and update album
        const transformedPhotos = await this.transformPhotoUrls(album);
        const result = { ...album.toObject(), photos: transformedPhotos };
        
        return result;
    }

    async transformPhotoUrls(album) {
        if (!album.photos || album.photos.length === 0) {
            return [];
        }

        // Transform each photo to include both key and URL
        const photoPromises = album.photos.map(async (photoKey) => {
            try {
                const signedUrl = await ImageService.getImageUrl(photoKey);
                return {
                    key: photoKey,
                    url: signedUrl
                };
            } catch (error) {
                console.error(`Error getting signed URL for photo ${photoKey}:`, error);
                return null;
            }
        });

        // Wait for all transformations and filter out failed ones
        const transformedPhotos = await Promise.all(photoPromises);
        return transformedPhotos.filter(photo => photo !== null);
    }

    async addPhotoToAlbum(userId, albumId, file) {
        if (!file) {
            throw new Error('No files uploaded');
        }

        const records = await RecordsRepository.findRecordsByUserId(userId);
        if (!records) {
            throw new Error('Records not found');
        }

        // Upload photos to S3
        if (!file.mimetype.startsWith('image/')) {
            throw new Error('Invalid file type');
        }
        const imageKey = await ImageService.uploadImage(file, Date.now().toString(), userId);

        return await RecordsRepository.addPhotoToAlbum(records, albumId, imageKey);
    }

    async deleteAlbum(userId, albumId) {
        const records = await RecordsRepository.findRecordsByUserId(userId);
        if (!records) {
            throw new Error('Records not found');
        }

        const album = await RecordsRepository.findAlbumById(records, albumId);
        if (!album) {
            throw new Error('Album not found');
        }

        // Delete photos from S3
        const deletePromises = album.photos.map(photoKey => 
            ImageService.deleteImage(photoKey)
        );
        await Promise.all(deletePromises);

        return await RecordsRepository.removeAlbum(records, albumId);
    }

    async deletePhotoFromAlbum(userId, albumId, photoKey) {
        const records = await RecordsRepository.findRecordsByUserId(userId);
        if (!records) {
            throw new Error('Records not found');
        }

        // Delete from S3
        await ImageService.deleteImage(photoKey);

        return await RecordsRepository.removePhotoFromAlbum(records, albumId, photoKey);
    }

    async editAlbum(userId, albumId, newName) {
        const records = await RecordsRepository.findRecordsByUserId(userId);
        if (!records) {
            throw new Error('Records not found');
        }

        const album = await RecordsRepository.findAlbumById(records, albumId);
        if (!album) {
            throw new Error('Album not found');
        }

        album.name = newName;
        return await records.save();
    }

    async editPhoto(userId, albumId, photoKey, file) {
        const records = await RecordsRepository.findRecordsByUserId(userId);
        if (!records) {
            throw new Error('Records not found');
        }

        const album = await RecordsRepository.findAlbumById(records, albumId);
        if (!album) {
            throw new Error('Album not found');
        }

        // Delete old photo from S3
        await ImageService.deleteImage(photoKey);

        // Upload new photo
        if (!file.mimetype.startsWith('image/')) {
            throw new Error('Invalid file type');
        }
        const newPhotoKey = await ImageService.uploadImage(file, Date.now().toString(), userId);

        // Replace old photo key with new one
        const photoIndex = album.photos.indexOf(photoKey);
        if (photoIndex === -1) {
            throw new Error('Photo not found in album');
        }
        album.photos[photoIndex] = newPhotoKey;

        return await records.save();
    }
}

module.exports = new RecordsService();
