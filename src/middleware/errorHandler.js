const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));
    return res.status(400).json({ error: 'Validation error', details: errors });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors[0]?.path || 'field';
    return res.status(400).json({ error: `${field} already exists` });
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({ error: 'Referenced resource not found' });
  }

  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal server error'
  });
};

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { errorHandler, AppError };