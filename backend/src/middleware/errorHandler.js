class BusinessException extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'BusinessException';
    this.code = code;
  }
}

class ValidationException extends Error {
  constructor(message, details) {
    super(message);
    this.name = 'ValidationException';
    this.code = 'VALIDATION_ERROR';
    this.details = details;
  }
}

const GlobalExceptionHandler = (err, req, res, next) => {
  console.error(err);

  if (err instanceof BusinessException || err.name === 'BusinessException') {
    return res.status(400).json({
      success: false,
      error: { code: err.code, message: err.message }
    });
  }

  if (err instanceof ValidationException || err.name === 'ValidationException') {
    return res.status(400).json({
      success: false,
      error: { code: err.code, message: err.message, details: err.details }
    });
  }

  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid input data', details: err.errors }
    });
  }

  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  }

  return res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred' }
  });
};

module.exports = {
  GlobalExceptionHandler,
  BusinessException,
  ValidationException
};
