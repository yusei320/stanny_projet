const db = require('../database/db');

async function findUserByEmail(email) {
  const result = await db.query(
    'SELECT * FROM users WHERE email = $1 LIMIT 1',
    [email]
  );
  return result.rows[0] || null;
}

async function createUser(userData) {
  const { name, email, password } = userData;
  const result = await db.query(
    'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
    [name, email, password]
  );
  return result.rows[0];
}

// La fonction ajoutée pour PostgreSQL
async function deleteUserAndData(userId) {
  const userResult = await db.query('SELECT email FROM users WHERE id = $1', [userId]);
  
  if (userResult.rows.length > 0) {
    const userEmail = userResult.rows[0].email; // Correction mineure : .rows[0].email
    await db.query('DELETE FROM clients WHERE email = $1', [userEmail]);
  }

  const deleteResult = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [userId]);
  return deleteResult.rows.length > 0;
}

module.exports = { findUserByEmail, createUser, deleteUserAndData };
