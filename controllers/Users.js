// routes/UsersRouter.js
const express = require('express');
const logger = require('../utils/logger');
const { jwtMiddleware } = require('../utils/middleware');

// SERVICES
const FriendService = require('../services/FriendService');
const NotificationService = require('../services/NotificationService');
const UserService = require('../services/UserService');
const RecordsService = require('../services/RecordsService');

const UsersRouter = express.Router();

//GET ALL USERS
UsersRouter.get('/', async (request, response, next) => {
  try {
    const users = await UserService.getAllUsersWithRelations();
    response.json(users);
  } catch (error) {
    next(error);
  }
});

// REGISTER USER
UsersRouter.post('/', async (request, response, next) => {
  const { firstName, lastName, username, password } = request.body;

  try {
    const user = await UserService.createUser(firstName, lastName, username, password);
    console.log("REGISTERED USER", user);
    await RecordsService.createRecord(user._id);
    response.status(201).json({ message: "Registered successfully!" });
  } catch (error) {
    logger.error('Error saving user:', error.message);
    next(error);
  }
});


// NOTIFICATIONS
UsersRouter.get('/notifications/', jwtMiddleware, async (request, response, next) => {
  try { 
    const { gUserID } = request;
    const notifications = await NotificationService.getUserNotifications(gUserID, false);
    response.json(notifications);
  } catch (error) {
    next(error);
  }
});

UsersRouter.patch('/read-notification/:notificationId', jwtMiddleware, async (request, response, next) => {
  try { 
    const { notificationId } = request.params;
    const notification = await NotificationService.markNotificationAsRead(notificationId);
    response.status(200).json({ 
      message: 'Notification marked as read',
      notification 
    });
  } catch (error) {
    if (error.message === 'Notification not found') {
      response.status(404).json({ error: error.message });
    } else {
      next(error);
    }
  }
});



// FRIENDS ROUTES
UsersRouter.get('/friends-list/:userId', async (request, response, next) => {
  try { 
    const { userId } = request.params;
    const user = await FriendService.getFriends(userId);
    response.json(user);
  } catch (error) {
    next(error);
  }
});

UsersRouter.post('/send-friend-request/:friendId', jwtMiddleware, async (request, response, next) => { 
  try {
    const { friendId } = request.params;
    const { gUserID } = request;
    await FriendService.sendFriendRequest(gUserID, friendId);
    response.status(200).json({ message: "User added successfully!" });
  } catch (error) {
    next(error);
  }  
});

UsersRouter.post('/cancel-friend-request/:friendId', jwtMiddleware, async (request, response, next) => {
  try {
    const { friendId } = request.params;
    const { gUserID } = request;
    await FriendService.cancelFriendRequest(gUserID, friendId);
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
    await FriendService.acceptFriendRequest(gUserID, friendId);
    response.status(200).json({ message: "User added successfully!" });
  } catch (error) {
    next(error);
  }  
});


UsersRouter.post('/remove-friend-request/:friendId', jwtMiddleware, async (request, response, next) => { 
  try {
    const { friendId } = request.params;
    const { gUserID } = request;
    await FriendService.removeFriendRequest(gUserID, friendId);
    response.status(200).json({ message: "User added successfully!" });
  } catch (error) {
    next(error);
  }  
});

// Get user progress
UsersRouter.get('/progress', jwtMiddleware, async (request, response, next) => {
  const userId = request.gUserID;

  try {
    const user = await UserService.getUserById(userId);
    if (!user) {
      return response.status(404).json({ message: "User not found" });
    }

    response.status(200).json({ 
      progress: user.progress,
      isAllCompleted: user.progress.every(step => step.completed)
    });
  } catch (error) {
    logger.error('Error fetching user progress:', error.message);
    next(error);
  }
});

// Update user progress
UsersRouter.patch('/progress/:stepTitle', jwtMiddleware, async (request, response, next) => {
  const { stepTitle } = request.params;
  const userId = request.gUserID;

  try {
    const user = await UserService.getUserById(userId);
    if (!user) {
      return response.status(404).json({ message: "User not found" });
    }

    const stepIndex = user.progress.findIndex(step => step.title === stepTitle);
    if (stepIndex === -1) {
      return response.status(404).json({ message: "Step not found" });
    }

    // Mark the specific step as completed
    user.progress[stepIndex].completed = true;

    await user.save();

    response.status(200).json({ 
      message: "Progress updated successfully",
      updatedStep: user.progress[stepIndex]
    });
  } catch (error) {
    logger.error('Error updating user progress:', error.message);
    next(error);
  }
});

module.exports = UsersRouter;
