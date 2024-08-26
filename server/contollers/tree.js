const treeRouter = require('express').Router()
const { User, Person } = require('../models/user')

// Add a child to a user (registered or not)
treeRouter.post('/:id/children', async (request, response) => {
    try {
      console.log('Request body:', request.body);
      console.log('Request params:', request.params);
  
      const { childId, childName, birthdate, deathdate } = request.body;
      const user = await User.findById(request.params.id);
  
      if (!user) {
        return response.status(404).json({ error: 'User not found' });
      }
  
      if (childId) {
        const child = await User.findById(childId);
        if (child) {
          user.children.push(child._id);
          child.parents.push(user._id);
          await child.save();
        } else {
          return response.status(404).json({ error: 'Child not found' });
        }
      } else {
        user.children.push({
            name: childName,
            birthdate: new Date(birthdate),
            deathdate: new Date(deathdate)
          });
      }
  
      await user.save();
      response.status(200).json(user);
    } catch (error) {
      console.error(error);
      response.status(400).json({ error: 'Bad Request' });
    }
  });
  
  
  
  // Add a parent to a user (registered or not)
  treeRouter.post('/:id/parents', async (request, response) => {
    const { parentId, parentName, birthdate, deathdate } = request.body;
    const user = await User.findById(request.params.id);
  
    if (!user) {
      return response.status(404).json({ error: 'User not found' });
    }
  
    if (parentId) {
      const parent = await User.findById(parentId);
      if (parent) {
        user.parents.push(parent._id);
        parent.children.push(user._id);
        await parent.save();
      } else {
        return response.status(404).json({ error: 'Parent not found' });
      }
    } else {
      user.parents.push({
          name: parentName,
          birthdate: new Date(birthdate),
          deathdate: new Date(deathdate)
        });
    }
  
    await user.save();
    response.status(200).json(user);
  });
  

module.exports = treeRouter
