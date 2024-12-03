class CustomError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

class InvalidObjectIdError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InvalidObjectIdError';
    this.statusCode = 400; 
    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404; 
    Error.captureStackTrace(this, this.constructor);
  }
}



module.exports = {
  CustomError,
  InvalidObjectIdError,
  NotFoundError
};
  