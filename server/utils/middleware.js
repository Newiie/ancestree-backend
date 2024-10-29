const logger = require('./logger');
const jwt = require('jsonwebtoken')
const { InvalidObjectIdError, NotFoundError } = require('./customErrors'); 
const User = require("../models/user")


const requestLogger = (request, response, next) => {
  logger.info('Method:', request.method);
  logger.info('Path:  ', request.path);
  logger.info('Body:  ', request.body);
  logger.info('---');
  next();  // Ensure next is called
};

const jwtMiddleware = async (req, res, next) => {
  const authorization = req.headers.authorization;
  let token = null;

  if (authorization && authorization.trim().toLowerCase().startsWith('bearer ')) {
      token = authorization.substring(7);
  }

  if (!token) {
      return res.status(401).json({ error: 'token missing' });
  }

  try {
      const decodedToken = jwt.verify(token, process.env.SECRET);
      const userId = decodedToken.id;

      const user = await User.findById(userId);
      if (!user) {
          return res.status(401).json({ error: 'user not found' });
      }

      if (req.body.userId && req.body.userId !== userId) {
        return res.status(401).json({ error: 'You are not authorized to perform this action' });
      }
      
      req.user = user;
      next();
  } catch (error) {
      return res.status(401).json({ error: 'token missing or invalid' });
  }
};

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' });
};

const errorHandler = (error, request, response, next) => {
  console.log("LOGGER ERROR:", error);
  console.log("Error constructor:", error.constructor.name);

  if (error instanceof MaxParentsError) {
    return response.status(error.statusCode).json({ error: error.message });
  }

  if (InvalidObjectIdError === error.constructor || error.constructor == NotFoundError) {
    return response.status(error.statusCode).json({ error: error.message });
  }

  switch (error.name) {
    case 'CastError':
      return response.status(400).send({ error: 'malformatted id' });
    case 'ValidationError':
      return response.status(400).json({ error: error.message });
    case 'MongoServerError':
      if (error.message.includes('E11000 duplicate key error')) {
        return response.status(400).json({ error: 'expected `username` to be unique' });
      }
      break;
    case 'JsonWebTokenError':
      return response.status(401).json({ error: 'token invalid' });
    case 'TokenExpiredError':
      return response.status(401).json({ error: 'token expired' });
    default:
      if (error.statusCode) {
        return response.status(error.statusCode).json({ error: error.message });
      }
      break;
  }

  next(error);  
};

module.exports = errorHandler;


module.exports = {
  requestLogger,
  unknownEndpoint,
  errorHandler,
  jwtMiddleware
};
