const db = require('../database/db');

async function findAllClients() {
  const result = await db.query(
    'SELECT * FROM clients ORDER BY id DESC'
  );

  return result.rows;
}

async function findById(id) {
  const result = await db.query(
    'SELECT * FROM clients WHERE id = $1',
    [id]
  );
  return result.rows[0];
}

async function createClient(clientData) {
  const { name, email, phone, address, company, notes } = clientData;

  const result = await db.query(
    'INSERT INTO clients (name, email, phone, address, company, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [name, email, phone, address, company, notes]
  );

  return result.rows[0];
}

async function updateClient(id, clientData) {
  const { name, email, phone, address, company, notes } = clientData;

  const result = await db.query(
    'UPDATE clients SET name = $1, email = $2, phone = $3, address = $4, company = $5, notes = $6, updated_at = NOW() WHERE id = $7 RETURNING *',
    [name, email, phone, address, company, notes, id]
  );

  return result.rows[0];
}

async function deleteClient(id) {
  // Délier les projets et documents liés pour éviter les erreurs de contrainte FK
  await db.query('UPDATE projects SET client_id = NULL WHERE client_id = $1', [id]);
  await db.query('UPDATE documents SET client_id = NULL WHERE client_id = $1', [id]);
  await db.query('DELETE FROM clients WHERE id = $1', [id]);
  return true;
}

module.exports = { findAllClients, findById, createClient, updateClient, deleteClient };