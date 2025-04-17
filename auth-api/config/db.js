const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const dbURL =
  process.env.RUN_ENV === 'AWS'
    ? process.env.DATABASE_AWS
    : process.env.DATABASE_LOCAL;

const pool = new Pool({ connectionString: dbURL,
  ssl: process.env.RUN_ENV === 'AWS' ? { rejectUnauthorized: false } : false
 });

const connectDB = async () => {
  try {
    await pool.query('SELECT NOW()');
    console.log('PostgreSQL Connected');
  } catch (err) {
    console.error('DB Connection Error:', err.message);
    process.exit(1);
  }
};

module.exports = { connectDB, pool };