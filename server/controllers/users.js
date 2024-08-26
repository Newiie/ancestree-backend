const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const {User} = require('../models/user')

// Create a new user
usersRouter.post('/', async (request, response) => {
  const { username, name, password } = request.body;

  // console.log('Received request body:', request.body);

  if (!username || !password) {
    console.log('Validation failed: Username or password missing');
    return response.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      name,
      passwordHash,
    });

    const savedUser = await user.save();
    // console.log('User saved successfully:', savedUser);
    response.status(201).json(savedUser);
  } catch (error) {
    console.error('Error saving user:', error);
    response.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get all users and populate notes, children, and parents
usersRouter.get('/', async (request, response) => {
  try {
    const users = await User.find({});

    // Manually populate children and parents
    const populatedUsers = await Promise.all(users.map(async (user) => {
      const populatedChildren = await Promise.all(user.children.map(async (child) => {
        if (child instanceof mongoose.Types.ObjectId) {
          // Populate child if it's an ObjectId
          return await User.findById(child).select('username name birthdate deathdate').lean();
        } else {
          // Return child as is if it's not an ObjectId
          return child;
        }
      }));

      const populatedParents = await Promise.all(user.parents.map(async (parent) => {
        if (parent instanceof mongoose.Types.ObjectId) {
          // Populate parent if it's an ObjectId
          return await User.findById(parent).select('username name birthdate deathdate').lean();
        } else {
          // Return parent as is if it's not an ObjectId
          return parent;
        }
      }));

      return {
        ...user.toJSON(),
        children: populatedChildren,
        parents: populatedParents
      };
    }));

    response.json(populatedUsers);
  } catch (error) {
    response.status(500).json({ error: 'Something went wrong' });
  }
});




module.exports = usersRouter
