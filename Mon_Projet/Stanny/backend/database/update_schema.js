const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'statcom_db',
  password: process.env.DB_PASSWORD || 'postgre',
  port: process.env.DB_PORT || 5432,
});

async function updateSchema() {
  const client = await pool.connect();
  try {
    console.log('UPDATING SCHEMA...');
    
    // Clients
    await client.query('ALTER TABLE clients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    
    // Employees
    await client.query('ALTER TABLE employees ADD COLUMN IF NOT EXISTS phone VARCHAR(50)');
    await client.query('ALTER TABLE employees ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    
    // Projects
    await client.query('ALTER TABLE projects ADD COLUMN IF NOT EXISTS category VARCHAR(100)');
    await client.query('ALTER TABLE projects ADD COLUMN IF NOT EXISTS manager VARCHAR(255)');
    await client.query('ALTER TABLE projects ADD COLUMN IF NOT EXISTS budget DECIMAL(15, 2) DEFAULT 0');
    await client.query('ALTER TABLE projects ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT \'En cours\'');
    await client.query('ALTER TABLE projects ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0');
    await client.query('ALTER TABLE projects ADD COLUMN IF NOT EXISTS description TEXT');
    await client.query('ALTER TABLE projects ADD COLUMN IF NOT EXISTS priority VARCHAR(50) DEFAULT \'Moyenne\'');
    await client.query('ALTER TABLE projects ADD COLUMN IF NOT EXISTS assignees JSONB DEFAULT \'[]\'::jsonb');
    await client.query('ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    
    // Tasks
    await client.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT \'À faire\'');
    await client.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description TEXT');
    await client.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT \'Moyenne\'');
    await client.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    
    // Caisse
    await client.query('ALTER TABLE caisse ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    
    console.log('SCHEMA UPDATED SUCCESSFULLY');
  } catch (err) {
    console.error('ERROR UPDATING SCHEMA:', err);
  } finally {
    client.release();
    process.exit();
  }
}

updateSchema();
