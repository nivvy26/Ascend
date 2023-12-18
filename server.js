require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json());

const mysql = require('mysql');

const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

function initializePool(callback) {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error connecting to MySQL: ', err);
      return callback(err);
    }
    console.log('Connected to MySQL database');
    connection.release();
    callback(null, pool);
  });
}

// Define poolModule to export the pool
const poolModule = {
  initializePool: initializePool,
  pool: pool,
};

module.exports = poolModule;

// Import route files
const usersRoutes = require('./routes/api/users');
const adminsRoutes = require('./routes/api/admins');
const documentsRoutes = require('./routes/api/documents');
const dashboardRoutes = require('./routes/api/dashboard');

// Use routes
app.use('/api/users', usersRoutes);
app.use('/api/admins', adminsRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
