const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/authMiddleware');

const JWT_SECRET = process.env.JWT_SECRET || 'civicflow_default_jwt_secret_dev';

// Default system accounts for development/testing
const DEFAULT_USERS = [
  {
    name: 'Super Admin',
    email: 'admin@civicflow.gov',
    password: 'admin123',
    role: 'SUPER_ADMIN'
  },
  {
    name: 'Municipal Staff',
    email: 'staff@civicflow.gov',
    password: 'staff123',
    role: 'STAFF'
  },
  {
    name: 'Citizen Demo',
    email: 'citizen@civicflow.gov',
    password: 'citizen123',
    role: 'CITIZEN'
  }
];

// In-Memory store for auth when MongoDB is not connected
let inMemoryUsers = [];

// Seed default users in-memory initially
(async () => {
  for (const u of DEFAULT_USERS) {
    const hashedPassword = await bcrypt.hash(u.password, 10);
    inMemoryUsers.push({
      _id: 'mem_usr_' + u.role.toLowerCase(),
      name: u.name,
      email: u.email.toLowerCase(),
      password: hashedPassword,
      role: u.role,
      createdAt: new Date()
    });
  }
})();

/**
 * Seed default accounts in MongoDB if they do not exist
 */
const seedDefaultUsers = async () => {
  if (mongoose.connection.readyState !== 1) return;
  try {
    for (const u of DEFAULT_USERS) {
      const existing = await User.findOne({ email: u.email.toLowerCase() });
      if (!existing) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(u.password, salt);
        await User.create({
          name: u.name,
          email: u.email.toLowerCase(),
          password: hashedPassword,
          role: u.role
        });
        console.log(`✅ Seeded default account: ${u.email} (${u.role})`);
      }
    }
  } catch (err) {
    console.error('Error seeding default users:', err.message);
  }
};

/**
 * POST /api/auth/register
 * Public registration - Citizens only
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name is required.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const isMongoConnected = mongoose.connection.readyState === 1;

    if (isMongoConnected) {
      // Check if user already exists in DB
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create new citizen user (Role is strictly forced to CITIZEN)
      const newUser = new User({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: 'CITIZEN'
      });

      await newUser.save();

      return res.status(201).json({
        success: true,
        message: 'Citizen account registered successfully.',
        data: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          createdAt: newUser.createdAt
        }
      });
    } else {
      // In-Memory fallback registration
      const existingUser = inMemoryUsers.find(u => u.email === normalizedEmail);
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = {
        _id: 'mem_usr_' + Date.now(),
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: 'CITIZEN',
        createdAt: new Date()
      };
      inMemoryUsers.push(newUser);

      return res.status(201).json({
        success: true,
        message: 'Citizen account registered successfully.',
        data: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          createdAt: newUser.createdAt
        }
      });
    }
  } catch (error) {
    console.error('Registration Error:', error.message);
    res.status(500).json({ success: false, message: 'Registration failed due to server or database error.' });
  }
});

/**
 * POST /api/auth/login
 * User login - Issues JWT token
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const isMongoConnected = mongoose.connection.readyState === 1;

    let user = null;

    if (isMongoConnected) {
      user = await User.findOne({ email: normalizedEmail }).select('+password');
    } else {
      user = inMemoryUsers.find(u => u.email === normalizedEmail);
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const userId = user._id || user.id;

    // Generate JWT token with safe payload
    const token = jwt.sign(
      {
        id: userId,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: userId,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('Login Error:', error.message);
    res.status(500).json({ success: false, message: 'Login failed due to server or database error.' });
  }
});

/**
 * GET /api/auth/me
 * Protected profile route
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const isMongoConnected = mongoose.connection.readyState === 1;
    let user = null;

    if (isMongoConnected) {
      user = await User.findById(req.user.id);
    } else {
      user = inMemoryUsers.find(u => String(u._id) === String(req.user.id));
    }

    if (!user) {
      // Fallback: Return basic user data from token if user record not found
      return res.json({
        success: true,
        data: {
          id: req.user.id,
          name: req.user.email.split('@')[0],
          email: req.user.email,
          role: req.user.role,
          createdAt: new Date()
        }
      });
    }

    res.json({
      success: true,
      data: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Fetch Me Error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to retrieve user profile.' });
  }
});

module.exports = router;
module.exports.seedDefaultUsers = seedDefaultUsers;

