const logger = require('./logger');
const jwt = require('jsonwebtoken')
const { InvalidObjectIdError, NotFoundError } = require('./customErrors'); 
const User = require("../models/User")

/**
 * Logger middleware that logs the request method, path, and body.
 *
 * @param {Object} request - The request object.
 * @param {Object} response - The response object.
 * @param {Function} next - The next middleware function.
 */
const requestLogger = (request, response, next) => {
  logger.info('Method:', request.method);
  logger.info('Path:  ', request.path);
  logger.info('Body:  ', request.body);
  logger.info('---');
  next(); 
};

const jwtMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1].trim();
  const treeId = req.headers['x-tree-id'];

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

      if (treeId) {
        if (user.familyTree.toString() !== treeId) {
          return res.status(401).json({ error: 'You are not authorized to perform this action' });
        }
      }
    
      req.gUserID = userId;
      req.user = user;
      next();
  } catch (error) {
      next(error);
  }
};

const profileJwtMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1].trim();
  const userId = req.params.userId || req.body.userId;

  if (!token) {
    return res.status(401).json({ error: 'token missing' });
  }

  try {
    const decodedToken = jwt.verify(token, process.env.SECRET);
    const tokenUserId = decodedToken.id;

    if (tokenUserId !== userId) {
      return res.status(401).json({ error: 'You are not authorized to access this profile' });
    }
    req.gUserID = userId;
    req.user = await User.findById(tokenUserId);
    if (!req.user) {
      return res.status(401).json({ error: 'user not found' });
    }

    next();
  } catch (error) {
    next(error);
  }
};

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' });
};

const errorHandler = (error, request, response, next) => {
  console.log("LOGGER ERROR:", error);
  console.log("Error constructor:", error.constructor.name);
 
  switch (error.constructor.name) {
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
      console.log("TOKEN EXPIRED");
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
  jwtMiddleware,
  profileJwtMiddleware
};
