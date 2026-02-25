const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let error = {
    message: err.message || 'Internal Server Error',
    status: err.status || 500
  };

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, status: 400 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = { message: 'Invalid token', status: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    error = { message: 'Token expired', status: 401 };
  }

  // PostgreSQL errors
  if (err.code === '23505') { // Unique violation
    error = { message: 'Resource already exists', status: 409 };
  }

  if (err.code === '23503') { // Foreign key violation
    error = { message: 'Referenced resource not found', status: 400 };
  }

  if (err.code === '23502') { // Not null violation
    error = { message: 'Required field missing', status: 400 };
  }

  // Rate limit error
  if (err.status === 429) {
    error = { message: 'Too many requests', status: 429 };
  }

  res.status(error.status).json({
    success: false,
    error: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = { errorHandler };
