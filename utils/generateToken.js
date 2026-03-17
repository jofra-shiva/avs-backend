const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  const secret = process.env.JWT_SECRET || 'default_secret_fallback_123';
  return jwt.sign({ id: id.toString() }, secret, {
    expiresIn: '30d',
  });
};

module.exports = generateToken;
