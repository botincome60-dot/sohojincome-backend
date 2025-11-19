const rateLimit = require('express-rate-limit');

const authenticateRequest = (req, res, next) => {
  next();
};

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});

module.exports = {
  authenticateRequest,
  apiLimiter
};