// utils/customError.js

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
    this.statusCode = 400; // Bad Request
    Error.captureStackTrace(this, this.constructor); // Ensure the stack trace is correctly set
  }
}

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404; // Not Found
    Error.captureStackTrace(this, this.constructor); // Ensure the stack trace is correctly set
  }
}



module.exports = {
  CustomError,
  InvalidObjectIdError,
  NotFoundError
};
  