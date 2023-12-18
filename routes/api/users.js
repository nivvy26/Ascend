const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const validator = require('validator');
const poolModule = require('./../../server');

// Access the pool from the poolModule
const pool = poolModule.pool;

// Middleware for user input validation
function validateSignup(req, res, next) {
  const { name, dateOfBirth, contactNumber, email, password } = req.body;
  if (!name || !dateOfBirth || !contactNumber || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  if (!validator.isEmail(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }
  next();
}

router.post('/signup', validateSignup, (req, res) => {
  const { name, dateOfBirth, contactNumber, email, password, id_number } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);

  const checkExistingUserQuery = 'SELECT * FROM users WHERE email = ? OR id_number = ?';
  pool.query(checkExistingUserQuery, [email, id_number], (error, results) => {
    if (error) {
      console.error('Error checking existing user:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
    if (results.length > 0) {
      return res.status(409).json({ message: 'Email or ID number already exists' });
    }

    const createUserQuery = 'INSERT INTO users (name, dateOfBirth, contactNumber, email, password, id_number) VALUES (?, ?, ?, ?, ?, ?)';
    const values = [name, dateOfBirth, contactNumber, email, hashedPassword, id_number];

    pool.query(createUserQuery, values, (error, results) => {
      if (error) {
        console.error('Error creating user:', error);
        return res.status(500).json({ message: 'Error creating user' });
      }
      res.status(201).json({ message: 'User created successfully' });
    });
  });
});

function validateLogin(req, res, next) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  if (!validator.isEmail(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }
  next();
}
// Middleware for user login input validation
router.post('/login', validateLogin, (req, res) => {
  const { email, password } = req.body;

  // Check if the email exists in the database
  const findUserQuery = 'SELECT * FROM users WHERE email = ?';
  pool.query(findUserQuery, [email], (error, results) => {
    if (error) {
      console.error('Error finding user:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = results[0];
    const storedHashedPassword = user.password; // Assuming 'user.password' holds the hashed password

    // Compare the stored hashed password with the provided password
    bcrypt.compare(password, storedHashedPassword, (err, result) => {
      if (err) {
        console.error('Error comparing passwords:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }
      if (result) {
        // Update the session_logging table after successful login
        const updateSessionQuery = 'UPDATE session_logging SET loggedInAs = "user"';
        pool.query(updateSessionQuery, (error) => {
          if (error) {
            console.error('Error updating session:', error);
            return res.status(500).json({ message: 'Error updating session' });
          }
          res.status(200).json({ message: 'User logged in successfully' });
        });
      } else {
        res.status(401).json({ message: 'Invalid email or password' });
      }
    });
  });
});

module.exports = router;