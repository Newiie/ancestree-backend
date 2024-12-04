const config = require('./utils/config')
const express = require('express')
require('express-async-errors')
const app = express()
const cors = require('cors')
const Person = require('./models/Person');
const PersonNode = require('./models/PersonNode');
const FamilyTree = require('./models/FamilyTree');
const User = require('./models/User');

// ROUTER REFERENCE
const usersRouter = require('./controllers/Users')
const loginRouter = require('./controllers/Auth')
const treeRouter = require('./controllers/Tree')
const personRouter = require('./controllers/Person')

const middleware = require('./utils/middleware')
const logger = require('./utils/logger')
const mongoose = require('mongoose')

mongoose.set('strictQuery', false)

logger.info('connecting to', config.MONGODB_URI)


mongoose.connect(config.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 20000, 
  socketTimeoutMS: 45000, 
});

app.use(cors())
app.use(express.static('dist'))
app.use(express.json())
app.use(middleware.requestLogger)

// RESET
const reset = async () => {
  const resetFunction = async () => {
    await User.deleteMany({});
    await FamilyTree.deleteMany({});
    await Person.deleteMany({});
    await PersonNode.deleteMany({});
    console.log('reset done')
  }
  await resetFunction();
}

// reset();

// ROUTER
app.use('/api/users', usersRouter)
app.use('/api/login', loginRouter)
app.use('/api/trees', treeRouter)
app.use('/api/person', personRouter)

app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

module.exports = app