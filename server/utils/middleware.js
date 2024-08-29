const logger = require('./logger');
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
  const authorization = req.get('authorization');
  let token = null;

  if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
    token = authorization.substring(7);
  }

  try {
    const decodedToken = jwt.verify(token, process.env.SECRET); // Use the secret key used for signing the token

    if (!token || !decodedToken.id) {
      return res.status(401).json({ error: 'token missing or invalid' });
    }

    req.user = await User.findById(decodedToken.id);
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
  console.log("Error constructor:", error.constructor.name); // Check the constructor name
  console.log(InvalidObjectIdError === error.constructor); // Should return true

  if (error instanceof MaxParentsError) {
    return response.status(error.statusCode).json({ error: error.message });
  }

  if (InvalidObjectIdError === error.constructor|| error.constructor == NotFoundError) {
    return response.status(error.statusCode).json({ error: error.message });
  }

  

  // switch (error.name) {
    
  //   case 'CastError':
  //     return response.status(400).send({ error: 'malformatted id' });
  //   case 'ValidationError':
  //     return response.status(400).json({ error: error.message });
  //   case 'MongoServerError':
  //     if (error.message.includes('E11000 duplicate key error')) {
  //       return response.status(400).json({ error: 'expected `username` to be unique' });
  //     }
  //     break;
  //   case 'JsonWebTokenError':
  //     return response.status(401).json({ error: 'token invalid' });
  //   case 'TokenExpiredError':
  //     return response.status(401).json({ error: 'token expired' });
  //   default:
  //     if (error.statusCode) {
  //       // Handle other custom error status codes if set
  //       return response.status(error.statusCode).json({ error: error.message });
  //     }
  //     break;
  // }

  // next(error);  // Pass the error to the next middleware if not handled
};

module.exports = errorHandler;


module.exports = {
  requestLogger,
  unknownEndpoint,
  errorHandler,
  jwtMiddleware
};
