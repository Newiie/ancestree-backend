const express = require('express');
const PersonRouter = express.Router();
const { jwtMiddleware } = require('../utils/middleware');
const PersonService = require('../services/PersonService');
const UserRepository = require('../repositories/UserRepository');
const { profileJwtMiddleware } = require('../utils/middleware');
// PersonRouter.use(jwtMiddleware);
const { isValidObjectId } = require('../utils/helper');
const { upload } = require('../utils/helper');

PersonRouter.get('/find-person', async (req, res, next) => {
    try { 
        console.log("QUERY", req.query);
        const { 
            firstName, 
            middleName, 
            lastName, 
            birthdate 
        } = req.query;

        const personDetails = { firstName, middleName, lastName, birthdate };
        console.log("PERSON DETAILS", personDetails);
        const person = await PersonService.findPersons(personDetails);
        res.json(person);
    } catch (error) {
        next(error);
    }
});

PersonRouter.get('/:userId', async (req, res, next) => {
    try {
        const { userId } = req.params;
        
        if (userId == null || !isValidObjectId(userId)) {
            return res.status(400).json({ message: 'Invalid User ID' });
        }

        const person = await PersonService.getPersonByUserId(userId);
        res.json(person);
    } catch (error) {
        next(error);
    }
});

PersonRouter.patch('/:userId', profileJwtMiddleware, async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { body } = req;


        const user = await UserRepository.findUserById(userId);
        const person = await PersonService.updatePerson(user.person._id, body);

        res.json(person);
    } catch (error) {
        console.error("Error updating person:", error);
        next(error);
    }
});

PersonRouter.post('/:userId/profile-picture', profileJwtMiddleware, upload.single('profilePicture'), async (req, res, next) => {
    try {
        const { userId } = req.params;
        
        if (req.file == null) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        if (!req.file.mimetype.startsWith('image/')) {
            return res.status(400).json({ message: 'Invalid file type' });
        }

        const person = await PersonService.updateProfilePicture(userId, req.file);
        res.status(200).json(person);
    } catch (error) {
        next(error);
    }
})

PersonRouter.post('/:userId/background-picture', profileJwtMiddleware, upload.single('backgroundPicture'), async (req, res, next) => {
    try {
        const { userId } = req.params;
        
        if (req.file == null) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        if (!req.file.mimetype.startsWith('image/')) {
            return res.status(400).json({ message: 'Invalid file type' });
        }

        const person = await PersonService.updateBackgroundPicture(userId, req.file);
        res.status(200).json(person);
    } catch (error) {
        next(error);
    }
})

module.exports = PersonRouter;
