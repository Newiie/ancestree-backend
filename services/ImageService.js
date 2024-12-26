const { uploadToS3, getUrlImage, deleteFromS3 } = require('../utils/s3');

class ImageService {
    /**
     * Generic method to upload any image type to S3
     * @param {Object} file - The file object from multer
     * @param {string} imageType - Type of image (e.g., 'profilePicture', 'backgroundPicture', 'familyMemberPicture')
     * @param {string} identifier - Unique identifier (e.g., username, familyMemberId)
     * @returns {Promise<string>} The filename of the uploaded image
     */
    static async uploadImage(file, imageType, identifier) {
        if (!file || !imageType || !identifier) {
            throw new Error('Missing required parameters for image upload');
        }

        try {
            const fileName = `${identifier}-${imageType}`;
            const newFileName = await uploadToS3(file, fileName, identifier);
            return newFileName;
        } catch (error) {
            console.error('Error uploading image:', error);
            throw new Error('Failed to upload image');
        }
    }

    /**
     * Get signed URL for an image
     * @param {string} fileName - The filename of the image
     * @returns {Promise<string>} The signed URL of the image
     */
    static async getImageUrl(fileName) {
        if (!fileName) {
            throw new Error('Filename is required');
        }
        return getUrlImage(fileName);
    }

    /**
     * Upload a profile picture
     * @param {Object} file - The file object from multer
     * @param {string} identifier - Unique identifier (username or ID)
     * @returns {Promise<string>} The filename of the uploaded profile picture
     */
    static async uploadProfilePicture(file, identifier) {
        return this.uploadImage(file, 'profilePicture', identifier);
    }

    /**
     * Upload a background picture
     * @param {Object} file - The file object from multer
     * @param {string} identifier - Unique identifier (username or ID)
     * @returns {Promise<string>} The filename of the uploaded background picture
     */
    static async uploadBackgroundPicture(file, identifier) {
        return this.uploadImage(file, 'backgroundPicture', identifier);
    }

    /**
     * Upload a family member picture
     * @param {Object} file - The file object from multer
     * @param {string} identifier - Unique identifier (family member ID)
     * @returns {Promise<string>} The filename of the uploaded family member picture
     */
    static async uploadFamilyMemberPicture(file, identifier) {
        return this.uploadImage(file, 'familyMemberPicture', identifier);
    }

    /**
     * Delete an image from S3
     * @param {string} fileName - The filename of the image to delete
     * @returns {Promise<void>}
     */
    static async deleteImage(fileName) {
        if (!fileName) {
            throw new Error('Filename is required for deletion');
        }

        try {
            await deleteFromS3(fileName);
        } catch (error) {
            console.error('Error deleting image:', error);
            throw new Error('Failed to delete image');
        }
    }
}

module.exports = ImageService;
