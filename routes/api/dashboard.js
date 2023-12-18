const express = require('express');
const router = express.Router();
const poolModule = require('./../../server');

// Access the pool from the poolModule
const pool = poolModule.pool;

// Middleware to check if loggedInAs is 'admin'
function checkAdmin(req, res, next) {
  // Check the value of loggedInAs
  const checkLoggedInAsQuery = 'SELECT loggedInAs FROM session_logging';
  pool.query(checkLoggedInAsQuery, (error, results) => {
    if (error) {
      console.error('Error checking loggedInAs:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }

    if (results.length === 0 || results[0].loggedInAs !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    next(); // Continue to the route handler if loggedInAs is 'admin'
  });
}

// Function to view unfinished requests
router.get('/unfinished-requests', checkAdmin, (req, res) => {
  const getUnfinishedRequestsQuery = 'SELECT * FROM document_requests WHERE status = ?';
  pool.query(getUnfinishedRequestsQuery, ['Unfinished'], (error, results) => {
    if (error) {
      console.error('Error retrieving unfinished requests:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
    res.status(200).json(results);
  });
});

// Function to update status of a specific request to 'Finished'
router.post('/modify-unfinished-request', checkAdmin, (req, res) => {
    const { id_number, document_type } = req.headers;
  
    // Check if required headers are present
    if (!id_number || !document_type) {
      return res.status(400).json({ message: 'Required headers are missing' });
    }
  
    const status = 'Finished'; // Constant status value
  
    // Perform the update based on the provided headers and constant status
    const updateRequestQuery = `
      UPDATE document_requests
      SET status = ?
      WHERE id = ? AND document_type = ?
    `;
  
    pool.query(updateRequestQuery, [status, id_number, document_type], (error, results) => {
      if (error) {
        console.error('Error updating request:', error);
        return res.status(500).json({ message: 'Error updating request' });
      }
      res.status(200).json({ message: 'Request updated to Finished' });
    });
  });

// Function to view finished requests
router.get('/finished-requests', checkAdmin, (req, res) => {
  const getFinishedRequestsQuery = 'SELECT * FROM document_requests WHERE status = ?';
  pool.query(getFinishedRequestsQuery, ['Finished'], (error, results) => {
    if (error) {
      console.error('Error retrieving finished requests:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
    res.status(200).json(results);
  });
});

// Function to view all users
router.get('/users', checkAdmin, (req, res) => {
  const getUsersQuery = 'SELECT name FROM users';
  pool.query(getUsersQuery, (error, results) => {
    if (error) {
      console.error('Error retrieving users:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
    res.status(200).json(results);
  });
});

module.exports = router;
