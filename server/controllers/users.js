// routes/usersRouter.js
const express = require('express');
const UserService = require('../services/UserService');

const usersRouter = express.Router();

// Create a new user
usersRouter.post('/', async (request, response) => {
  const { username, name, password } = request.body;

  try {
    const savedUser = await UserService.createUser(username, name, password);
    response.status(201).json(savedUser);
  } catch (error) {
    console.error('Error saving user:', error.message);
    response.status(400).json({ error: error.message });
  }
});

// Get all users and populate relations
usersRouter.get('/', async (request, response) => {
  try {
    const users = await UserService.getAllUsersWithRelations();
    response.json(users);
  } catch (error) {
    console.error('Error fetching users:', error.message);
    response.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = usersRouter;
