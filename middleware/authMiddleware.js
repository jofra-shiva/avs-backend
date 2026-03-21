const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');

// A) verifyToken: Read token from Authorization header, verify JWT, fetch employee
const verifyToken = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const secret = process.env.JWT_SECRET || 'default_secret_fallback_123';
      const decoded = jwt.verify(token, secret);

      // Fetch employee from DB using employeeId (which is 'id' in the token payload)
      // Do NOT trust token alone - fetch full employee object
      req.employee = await Employee.findById(decoded.id).select('-password');

      if (!req.employee) {
        return res.status(401).json({ message: 'Not authorized, employee not found' });
      }

      next();
    } catch (error) {
      console.error('Token verification error:', error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// B) checkAccess(moduleName): Allow if admin OR module assigned
const checkAccess = (moduleName) => {
  return (req, res, next) => {
    if (!req.employee) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (req.employee.role === 'admin' || req.employee.modules.includes(moduleName)) {
      next();
    } else {
      res.status(403).json({ message: 'Access Denied' });
    }
  };
};

// C) adminOnly: Allow only if role === admin
const adminOnly = (req, res, next) => {
  if (req.employee && req.employee.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access Denied: Admin only' });
  }
};

module.exports = { verifyToken, checkAccess, adminOnly };
