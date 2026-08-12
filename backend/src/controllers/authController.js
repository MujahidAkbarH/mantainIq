const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

// Helper to sign JWT token
const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || 'super_secret_hackathon_key_2026';
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email, name: user.name },
    secret,
    { expiresIn: '7d' }
  );
};

// Check DB Connection State helper
const ensureDbConnected = async () => {
  if (mongoose.connection.readyState !== 1) {
    console.warn('[Auth Controller] MongoDB not connected. Attempting connection...');
    const connectDB = require('../config/db');
    await connectDB();
  }
};

// @route   POST /api/auth/register
// @desc    Register a new user (Admin or Technician)
// @access  Public
exports.registerUser = async (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');

  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Please provide all required fields: name, email, and password',
      });
    }

    // Ensure Role is valid
    const userRole = role || 'Technician';
    if (!['Admin', 'Technician'].includes(userRole)) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: `Invalid role '${userRole}'. Allowed roles are 'Admin' or 'Technician'.`,
      });
    }

    // Ensure DB Connection
    await ensureDbConnected();

    // Check existing user
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User exists',
        message: 'An account with this email address already exists.',
      });
    }

    // Create User
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: userRole,
    });

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('[Registration Catch Error Stack]:', error.stack || error);
    return res.status(500).json({
      error: 'Registration failed',
      details: error.message,
      stack: error.stack,
    });
  }
};

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
exports.loginUser = async (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Please provide both email and password',
      });
    }

    // Ensure DB Connection
    await ensureDbConnected();

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication failed',
        message: 'Invalid credentials. User not found.',
      });
    }

    // Match password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Authentication failed',
        message: 'Invalid credentials. Incorrect password.',
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('[Login Catch Error Stack]:', error.stack || error);
    return res.status(500).json({
      error: 'Login failed',
      details: error.message,
      stack: error.stack,
    });
  }
};

// @route   GET /api/auth/me
// @desc    Get currently logged in user profile
// @access  Private
exports.getMe = async (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');

  try {
    const user = req.user;
    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Profile fetch failed',
      details: error.message,
      stack: error.stack,
    });
  }
};

// @route   GET /api/auth/technicians
// @desc    Get all technician accounts
// @access  Private (Admin Only)
exports.getTechnicians = async (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    await ensureDbConnected();
    const technicians = await User.find({ role: 'Technician' }).select('-password');
    return res.status(200).json({
      success: true,
      technicians,
    });
  } catch (error) {
    console.error('[Get Technicians Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch technician list.',
      error: error.message,
    });
  }
};

