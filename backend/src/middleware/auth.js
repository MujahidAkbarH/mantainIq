const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token from Authorization header
const verifyToken = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.',
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'super_secret_jwt_key_maintainiq_2026'
    );

    // Fetch user profile from DB excluding password
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed. User no longer exists.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
    });
  }
};

// Middleware for Admin role only
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'Admin') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access forbidden. Administrator privileges required.',
  });
};

// Middleware for Technician or Admin role
const requireTechnician = (req, res, next) => {
  if (req.user && (req.user.role === 'Technician' || req.user.role === 'Admin')) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access forbidden. Technician access required.',
  });
};

// Restrict to specific roles
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user?.role}' is not authorized to perform this action. Required: ${roles.join(', ')}`,
      });
    }
    next();
  };
};

module.exports = {
  verifyToken,
  requireAdmin,
  requireTechnician,
  restrictTo,
};
