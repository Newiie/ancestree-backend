const Record = require('../models/Records');

class RecordsRepository {
    async findRecordsByUserId(userId) {
        return await Record.findOne({ user: userId }).populate('user');
    }

    async createRecord(userId) {
        const record = new Record({
            user: userId,
            albums: []
        });
        return await record.save();
    }

    async addAlbum(userId, albumName) {
        let records = await this.findRecordsByUserId(userId);
        
        if (!records) {
            records = await this.createRecord(userId);
        }

        records.albums.push({
            name: albumName,
            photos: []
        });

        return await records.save();
    }

    async findAlbumById(records, albumId) {
        return records.albums.id(albumId);
    }

    async addPhotoToAlbum(records, albumId, photoKey) {
        const album = await this.findAlbumById(records, albumId);
        if (!album) {
            throw new Error('Album not found');
        }

        album.photos.push(photoKey);
        return await records.save();
    }

    async removeAlbum(records, albumId) {
        const album = await this.findAlbumById(records, albumId);
        if (!album) {
            throw new Error('Album not found');
        }

        records.albums = records.albums.filter(album => album._id.toString() !== albumId);
        return await records.save();
    }

    async removePhotoFromAlbum(records, albumId, photoKey) {
        const album = await this.findAlbumById(records, albumId);
        if (!album) {
            throw new Error('Album not found');
        }

        const photoIndex = album.photos.indexOf(photoKey);
        if (photoIndex === -1) {
            throw new Error('Photo not found in album');
        }

        album.photos.splice(photoIndex, 1);
        return await records.save();
    }
}

module.exports = new RecordsRepository();
