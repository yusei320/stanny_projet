const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'statcom_db',
  password: process.env.DB_PASSWORD || 'postgre',
  port: process.env.DB_PORT || 5432,
});

async function testInsert() {
  const client = await pool.connect();
  try {
    console.log('Testing INSERT INTO clients...');
    const result = await client.query(
      'INSERT INTO clients (name, email, phone, address, company, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      ['Test Client', 'test@test.com', '12345678', null, 'Test Corp', null]
    );
    console.log('INSERT SUCCESS:', result.rows[0]);
  } catch (err) {
    console.error('INSERT ERROR:', err);
  } finally {
    client.release();
    process.exit();
  }
}

testInsert();
