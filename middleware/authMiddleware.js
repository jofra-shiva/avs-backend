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
      token = req.headers.authorization.split(' ')[1];
      const secret = process.env.JWT_SECRET || 'default_secret_fallback_123';
      const decoded = jwt.verify(token, secret);

      // Fetch employee using employeeId (decoded.id)
      req.employee = await Employee.findById(decoded.id).select('-password');

      if (!req.employee) {
        console.warn(`[AuthMiddleware] Employee NOT FOUND in DB for ID: ${decoded.id}`);
        return res.status(401).json({ message: 'Not authorized, employee not found' });
      }

      next();
    } catch (error) {
      console.error('[AuthMiddleware] Token verification error:', error.message);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const checkAccess = (moduleName) => {
  return (req, res, next) => {
    if (!req.employee) {
      return res.status(401).json({ message: 'Not authorized, no employee object found' });
    }

    const isAdmin = req.employee.role && req.employee.role.toLowerCase() === 'admin';
    const hasModuleAccess = req.employee.modules && req.employee.modules.includes(moduleName);

    if (isAdmin || hasModuleAccess) {
      next();
    } else {
      console.warn(`[AccessDenied] Employee: ${req.employee.name}, Role: ${req.employee.role}, Module: ${moduleName}`);
      res.status(403).json({ 
        message: 'Access Denied', 
        details: `Employee role '${req.employee.role}' does not have access to module '${moduleName}'` 
      });
    }
  };
};

// C) adminOnly: Allow only if role === admin
const adminOnly = (req, res, next) => {
  if (req.employee && req.employee.role && req.employee.role.toLowerCase() === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access Denied: Admin only' });
  }
};

module.exports = { verifyToken, checkAccess, adminOnly };
