// routes/UsersRouter.js
const express = require('express');
const UserService = require('../services/UserService');
const logger = require('../utils/logger');
const { jwtMiddleware } = require('../utils/middleware');
const UsersRouter = express.Router();

UsersRouter.post('/', async (request, response, next) => {
  const { firstName, lastName, username, password } = request.body;

  try {
    await UserService.createUser(firstName, lastName, username, password);
    response.status(201).json({ message: "Registered successfully!" });
  } catch (error) {
    logger.error('Error saving user:', error.message);
    next(error);
  }
});

UsersRouter.get('/friends-list/:userId', async (request, response, next) => {
  try { 
    const { userId } = request.params;
    const user = await UserService.getUserFriendsField(userId);
    response.json(user);
  } catch (error) {
    next(error);
  }
});



UsersRouter.get('/', async (request, response, next) => {
  try {
    const users = await UserService.getAllUsersWithRelations();
    response.json(users);
  } catch (error) {
    next(error);
  }
});

UsersRouter.post('/send-friend-request/:friendId', jwtMiddleware, async (request, response, next) => { 
  try {
    const { friendId } = request.params;
    const { gUserID } = request;
    console.log("G USER ID", gUserID);
    console.log("FRIEND ID", friendId);
    await UserService.sendFriendRequest(gUserID, friendId);
    response.status(200).json({ message: "User added successfully!" });
  } catch (error) {
    next(error);
  }  
});

UsersRouter.post('/cancel-friend-request/:friendId', jwtMiddleware, async (request, response, next) => {
  try {
    const { friendId } = request.params;
    const { gUserID } = request;
    console.log("G USER ID", gUserID);
    console.log("FRIEND ID", friendId);
    await UserService.cancelFriendRequest(gUserID, friendId);
    response.status(200).json({ message: "User added successfully!" });
  } catch (error) {
    next(error);
  }  
});

UsersRouter.post('/accept-friend-request/:friendId', jwtMiddleware, async (request, response, next) => { 
  try {
    const { friendId } = request.params;
    const { gUserID } = request;

    console.log("FRIEND ID", friendId);
    console.log("G USER ID", gUserID);
    await UserService.acceptFriendRequest(gUserID, friendId);
    response.status(200).json({ message: "User added successfully!" });
  } catch (error) {
    next(error);
  }  
});

module.exports = UsersRouter;
