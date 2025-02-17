const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

const loginRouter = require('express').Router()
const User = require('../models/User')
const logger = require('../utils/logger')


loginRouter.post('/', async (request, response) => {
  try {
    const { username, password } = request.body

    const user = await User.findOne({ username })
      const passwordCorrect = user === null
      ? false
      : await bcrypt.compare(password, user.passwordHash)

    if (!(user && passwordCorrect)) {
      return response.status(400).json({
        error: 'Invalid username or password'
      })
  }

  const userForToken = {
    username: user.username,
    id: user._id,
  }

  const isCompleted = user.progress ? user.progress.every(step => step.completed) : false;

  const token = jwt.sign(
    { 
      username: user.username, 
      id: user._id 
    }, 
    process.env.SECRET, 
    { expiresIn: 60 * 60 }
  )

  logger.info({ token, username: user.username, id: user._id })
  response
      .status(200)
      .send({ 
        token, 
        username: user.username, 
        id: user._id,
        isCompleted
      })
  } catch (error) {
    console.error('Error during login:', error);
    response.status(500).json({ error: 'Internal server error' });
  }
})

module.exports = loginRouter