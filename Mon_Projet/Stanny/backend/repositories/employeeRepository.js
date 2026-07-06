const db = require('../database/db');

function enrichEmployee(employee) {
  return {
    ...employee,
    status: typeof employee.status === 'undefined' ? null : employee.status,
    phone: typeof employee.phone === 'undefined' ? null : employee.phone,
    email: typeof employee.email === 'undefined' ? null : employee.email,
    address: typeof employee.address === 'undefined' ? null : employee.address,
    notes: typeof employee.notes === 'undefined' ? null : employee.notes
  };
}

async function findAllEmployees(userId) {
  const result = await db.query(
    'SELECT * FROM employees WHERE user_id = $1 ORDER BY id DESC',
    [userId]
  );

  return result.rows.map(enrichEmployee);
}

async function findById(id) {
  const result = await db.query(
    'SELECT * FROM employees WHERE id = $1',
    [id]
  );
  if (!result.rows[0]) return null;
  return enrichEmployee(result.rows[0]);
}

async function createEmployee(employeeData) {
  const { name, role, phone, userId } = employeeData;

  const result = await db.query(
    'INSERT INTO employees (name, role, phone, user_id) VALUES ($1, $2, $3, $4) RETURNING *',
    [name, role, phone, userId]
  );

  return enrichEmployee(result.rows[0]);
}

async function deleteEmployeeById(id) {
  const result = await db.query(
    'DELETE FROM employees WHERE id = $1 RETURNING *',
    [id]
  );

  if (!result.rows[0]) {
    return null;
  }

  return enrichEmployee(result.rows[0]);
}

async function updateEmployee(id, employeeData) {
  const { name, role, status, phone, email, address, notes } = employeeData;

  const result = await db.query(
    'UPDATE employees SET name = $1, role = $2, status = $3, phone = $4, email = $5, address = $6, notes = $7, updated_at = NOW() WHERE id = $8 RETURNING *',
    [name, role, status, phone, email, address, notes, id]
  );

  if (!result.rows[0]) return null;
  return enrichEmployee(result.rows[0]);
}

module.exports = { findAllEmployees, findById, createEmployee, updateEmployee, deleteEmployeeById };