const { Pool } = require('pg');
require('dotenv').config();

// connectionString ద్వారా Neon DB కి కనెక్ట్ అవుతుంది
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Neon DB connection కోసం ఇది తప్పనిసరి
  },
});

// Test Connection & Catch Errors
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ PostgreSQL Connection Error:', err.stack);
  } else {
    console.log('✅ PostgreSQL Database connected successfully!');
    release();
  }
});

module.exports = pool;