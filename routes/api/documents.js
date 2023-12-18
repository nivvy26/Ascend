const express = require('express');
const router = express.Router();
const validator = require('validator');
const poolModule = require('./../../server');

// Access the pool from the poolModule
const pool = poolModule.pool;

// Middleware for document request validation
function validateDocumentRequest(req, res, next) {
  const { document_type, full_name, pickup_date, contact_number, purpose, id_number } = req.body;
  if (!document_type || !full_name || !pickup_date || !contact_number || !purpose) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  // Validate the pickup date format
  if (!validator.isDate(pickup_date, { format: 'MM/DD/YYYY' })) {
    return res.status(400).json({ message: 'Invalid pickup date format. Use MM/DD/YYYY format' });
  }

  // Validate the contact number format (numeric)
  if (!validator.isNumeric(contact_number)) {
    return res.status(400).json({ message: 'Contact number should be numeric' });
  }

  // Validate the document type (e.g., 'Barangay ID' or 'Barangay Clearance')
  if (!['Barangay ID', 'Barangay Clearance'].includes(document_type)) {
    return res.status(400).json({ message: 'Invalid document type' });
  }
  next();
}

// Request document route
router.post('/', validateDocumentRequest, (req, res) => {
  const { document_type, full_name, pickup_date, contact_number, purpose, id_number } = req.body;

  // Check if loggedInAs is set to 'user'
  const checkLoggedInAsQuery = 'SELECT loggedInAs FROM session_logging';
  pool.query(checkLoggedInAsQuery, (error, results) => {
    if (error) {
      console.error('Error checking loggedInAs:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }

    if (results.length === 0 || results[0].loggedInAs !== 'user') {
      return res.status(403).json({ message: 'Unauthorized request' });
    }

    // Set the default value for status
    const status = 'Unfinished';

    // Perform the document request based on the specified type
    const requestDocumentQuery = `
      INSERT INTO document_requests 
      (document_type, full_name, pickup_date, contact_number, purpose, status, id_number) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    pool.query(requestDocumentQuery, [document_type, full_name, pickup_date, contact_number, purpose, status, id_number], (error, results) => {
      if (error) {
        console.error('Error requesting document:', error);
        return res.status(500).json({ message: 'Error requesting document' });
      }
      res.status(201).json({ message: 'Document request submitted successfully' });
    });
  });
});

module.exports = router;
