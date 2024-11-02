const express = require('express');
const PersonRouter = express.Router();
const { jwtMiddleware } = require('../utils/middleware');
const PersonService = require('../services/PersonService');

PersonRouter.use(jwtMiddleware);

PersonRouter.get('/:personId', async (req, res, next) => {
    try {
        const { personId } = req.params;
        const person = await PersonService.getPersonById(personId);
        res.json(person);
    } catch (error) {
        next(error);
    }
});

PersonRouter.put('/:personId', async (req, res, next) => {
    try {
        const { personId } = req.params;
        const { body } = req;
        const person = await PersonService.updatePersonGeneralInformation(personId, body);
        res.json(person);
    } catch (error) {
        next(error);
    }
});

PersonRouter.put('/:personId/update-general-information', async (req, res, next) => {
    try {
        const { personId } = req.params;
        const { body } = req;
        const person = await PersonService.updatePersonGeneralInformation(personId, body);
        res.json(person);
    } catch (error) {
        next(error);
    }
});

PersonRouter.put('/:personId/update-address', async (req, res, next) => {
    try {
        const { personId } = req.params;
        const { body } = req;
        const person = await PersonService.updateAddress(personId, body);
        res.json(person);
    } catch (error) {
        next(error);
    }
});

PersonRouter.put('/:personId/update-vital-information', async (req, res, next) => {
    try {
        const { personId } = req.params;
        const { body } = req;
        const person = await PersonService.updateVitalInformation(personId, body);
        res.json(person);
    } catch (error) {
        next(error);
    }
});

PersonRouter.put('/:personId/update-interests', async (req, res, next) => {
    try {
        const { personId } = req.params;
        const { body } = req;
        const person = await PersonService.updateInterests(personId, body);
        res.json(person);
    } catch (error) {
        next(error);
    }
});

PersonRouter.put('/:personId/update-emergency-contact', async (req, res, next) => {
    try {
        const { personId } = req.params;
        const { body } = req;
        const person = await PersonService.updateEmergencyContact(personId, body);
        res.json(person);
    } catch (error) {
        next(error);
    }
});

module.exports = PersonRouter;
