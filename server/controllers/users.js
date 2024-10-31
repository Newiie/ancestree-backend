// routes/UsersRouter.js
const express = require('express');
const UserService = require('../services/UserService');
const logger = require('../utils/logger');
const UsersRouter = express.Router();

// Create a new user
UsersRouter.post('/', async (request, response) => {
  const { username, name, password } = request.body;

  try {
    const savedUser = await UserService.createUser(username, name, password);
    response.status(201).json({ message: "Registered successfully!" });
  } catch (error) {
    logger.error('Error saving user:', error.message);
    response.status(400).json({ error: error.message });
  }
});

// Get all users and populate relations
UsersRouter.get('/', async (request, response) => {
  try {
    const users = await UserService.getAllUsersWithRelations();
    response.json(users);
  } catch (error) {
    console.error('Error fetching users:', error.message);
    response.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = UsersRouter;
