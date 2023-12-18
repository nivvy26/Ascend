const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const validator = require('validator'); // Import a validation library (e.g., validator)

// Your MySQL setup (already established in your main file)
const poolModule = require('./../../server');

// Access the pool from the poolModule
const pool = poolModule.pool;

// Middleware for admin login input validation
function validateAdminLogin(req, res, next) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  if (!validator.isEmail(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }
  next();
}

// Admin Login with input validation
router.post('/login', validateAdminLogin, (req, res) => {
  const { email, password } = req.body;

  const findAdminQuery = 'SELECT * FROM admins WHERE email = ?';
  pool.query(findAdminQuery, [email], (error, results) => {
    if (error) {
      console.error('Error finding admin:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const admin = results[0];
    if (!bcrypt.compareSync(password, admin.password)) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Update the session_logging table after successful admin login
    const updateSessionQuery = 'UPDATE session_logging SET loggedInAs = "admin"';
    pool.query(updateSessionQuery, (error) => {
      if (error) {
        console.error('Error updating session:', error);
        return res.status(500).json({ message: 'Error updating session' });
      }
      res.status(200).json({ message: 'Admin logged in successfully' });
    });
  });
});

module.exports = router;
