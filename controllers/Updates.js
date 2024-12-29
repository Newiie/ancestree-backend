const express = require('express');
const UpdatesRouter = express.Router();
const Update = require('../models/Update');
const jwtMiddleware = require('../utils/middleware').jwtMiddleware;
const logger = require('../utils/logger');
const mongoose = require('mongoose');
const FamilyTree = require('../models/FamilyTree');
const PersonNode = require('../models/PersonNode');
const Person = require('../models/Person');

// Get monthly updates for a user
UpdatesRouter.get('/', jwtMiddleware, async (request, response, next) => {
  const userId = request.gUserID;

  try {
    // Fetch updates from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const updates = await Update.aggregate([
      { 
        $match: { 
          userId: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: thirtyDaysAgo } 
        } 
      },
      {
        $group: {
          _id: '$type',
          details: { $first: '$details' },
          totalCount: { $sum: '$count' }
        }
      },
      { $limit: 5 }  // Limit to top 5 updates
    ]);

    // Transform updates to match frontend format
    const monthlyUpdates = updates.map(update => {
      switch(update._id) {
        case 'FAMILY_MEMBER_ADDED':
          return `${update.totalCount} new family members added`;
        case 'CONNECTION_FOUND':
          return `${update.totalCount} new connections found`;
        case 'RECORDS_UPLOADED':
          return `New family records uploaded`;
        case 'PHOTOS_ADDED':
          return `Family photos added to the gallery`;
        case 'TREE_UPDATED':
          return `Monthly update on family activities`;
        default:
          return update.details;
      }
    });

    response.status(200).json({ monthlyUpdates });
  } catch (error) {
    logger.error('Error fetching monthly updates:', error.message);
    next(error);
  }
});

// Get upcoming birthdays and anniversaries for family members
UpdatesRouter.get('/family-events', jwtMiddleware, async (request, response, next) => {
  const userId = request.gUserID;

  try {
    // Find the user's family tree
    const familyTree = await FamilyTree.findOne({ owner: userId });
    if (!familyTree) {
      return response.status(404).json({ message: 'Family tree not found' });
    }

    // Find all person nodes in the tree with their person details
    const personNodes = await PersonNode.find({ familyTree: familyTree._id })
      .populate('person');

    // Current date for comparison
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentDay = currentDate.getDate();

    // Collect upcoming birthdays and anniversaries
    const upcomingEvents = personNodes
      .filter(node => node.person && node.person.generalInformation.birthdate)
      .map(node => {
        const birthdate = node.person.generalInformation.birthdate;
        const birthMonth = birthdate.getMonth();
        const birthDay = birthdate.getDate();

        // Check if birthday is in the next 30 days
        const isBirthdaySoon = (birthMonth > currentMonth) || 
          (birthMonth === currentMonth && birthDay >= currentDay);

        return {
          personId: node.person._id,
          name: `${node.person.generalInformation.firstName} ${node.person.generalInformation.lastName}`,
          birthdate: birthdate,
          age: currentDate.getFullYear() - birthdate.getFullYear(),
          type: 'birthday'
        };
      })
      .filter(event => event.birthdate)
      .sort((a, b) => a.birthdate - b.birthdate)
      .slice(0, 5);  // Limit to top 5 events

    response.status(200).json({ upcomingEvents });
  } catch (error) {
    logger.error('Error fetching family events:', error.message);
    next(error);
  }
});

// Create a new update (typically called by system services)
UpdatesRouter.post('/', jwtMiddleware, async (request, response, next) => {
  const { type, details, count } = request.body;
  const userId = request.gUserID;

  try {
    const update = new Update({
      userId,
      type,
      details,
      count: count || 1
    });

    await update.save();

    response.status(201).json({ message: 'Update created successfully' });
  } catch (error) {
    logger.error('Error creating update:', error.message);
    next(error);
  }
});

module.exports = UpdatesRouter;
