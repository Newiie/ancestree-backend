const config = require('./utils/config')
const express = require('express')
require('express-async-errors')
const app = express()
const cors = require('cors')

// ROUTER REFERENCE
const usersRouter = require('./controllers/users')
const loginRouter = require('./controllers/login')
const treeRouter = require('./controllers/tree')

const middleware = require('./utils/middleware')
const logger = require('./utils/logger')
const mongoose = require('mongoose')

mongoose.set('strictQuery', false)

logger.info('connecting to', config.MONGODB_URI)


mongoose.connect(config.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 20000, // Increase the timeout to 20 seconds
  socketTimeoutMS: 45000, // Increase the socket timeout to 45 seconds
});

app.use(cors())
app.use(express.static('dist'))
app.use(express.json())
app.use(middleware.requestLogger)

// ROUTER
app.use('/api/users', usersRouter)
app.use('/api/login', loginRouter)
app.use('/api/tree', treeRouter)

app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

module.exports = app