const errorHandler = (err, req, res, next) => {
  // Ensure header is ALWAYS JSON
  res.setHeader('Content-Type', 'application/json');

  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';
  let errors = null;

  console.error(`[Express Error Handler] ${req.method} ${req.originalUrl}:`, err);

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    errors = Object.values(err.errors).map((e) => e.message);
  }

  // Mongoose Duplicate Key Error (code 11000)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate value entered for '${field}'. Please choose another value.`;
  }

  // Mongoose Cast Error (Invalid ID format)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Resource not found with invalid id of ${err.value}`;
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token expired';
  }

  return res.status(statusCode).json({
    success: false,
    message: message,
    errors: errors,
    details: process.env.NODE_ENV === 'production' ? null : err.stack || err.message,
  });
};

module.exports = errorHandler;
