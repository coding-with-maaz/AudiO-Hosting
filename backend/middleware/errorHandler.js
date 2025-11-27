const constants = require('../utils/constants');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error(err);

  // Sequelize validation error
  if (err.name === constants.SEQUELIZE_ERRORS.VALIDATION_ERROR) {
    const message = Object.values(err.errors).map(e => e.message).join(', ');
    error = {
      message,
      statusCode: constants.HTTP_STATUS.BAD_REQUEST
    };
  }

  // Sequelize unique constraint error
  if (err.name === constants.SEQUELIZE_ERRORS.UNIQUE_CONSTRAINT) {
    const message = constants.MESSAGES.DUPLICATE_FIELD;
    error = {
      message,
      statusCode: constants.HTTP_STATUS.BAD_REQUEST
    };
  }

  // Sequelize foreign key constraint error
  if (err.name === constants.SEQUELIZE_ERRORS.FOREIGN_KEY_CONSTRAINT) {
    const message = constants.MESSAGES.NOT_FOUND;
    error = {
      message,
      statusCode: constants.HTTP_STATUS.NOT_FOUND
    };
  }

  const statusCode = error.statusCode || constants.HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = error.message || err.message || constants.MESSAGES.SERVER_ERROR;
  
  res.status(statusCode).json({
    [constants.RESPONSE_KEYS.SUCCESS]: false,
    [constants.RESPONSE_KEYS.MESSAGE]: message,
    ...(process.env.NODE_ENV === constants.ENV.DEVELOPMENT && { 
      [constants.RESPONSE_KEYS.STACK]: err.stack,
      [constants.RESPONSE_KEYS.ERROR]: err.name || 'Unknown Error'
    })
  });
};

module.exports = errorHandler;

