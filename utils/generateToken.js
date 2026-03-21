const jwt = require('jsonwebtoken');

const generateToken = (payload) => {
  const secret = process.env.JWT_SECRET || 'default_secret_fallback_123';
  
  // If payload is just an ID string/objectID, wrap it in an object
  const data = typeof payload === 'object' && !Array.isArray(payload) && payload !== null
    ? payload 
    : { id: payload.toString() };

  return jwt.sign(data, secret, {
    expiresIn: '8h',
  });
};

module.exports = generateToken;
