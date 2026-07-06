const employeeRepository = require('../repositories/employeeRepository');
const { createHttpError } = require('../utils/http');
const {
  isNonEmptyString,
  normalizeOptionalString,
  isValidEmail
} = require('../utils/validators');

async function listEmployees(userId) {
  return employeeRepository.findAllEmployees(userId);
}

async function createEmployee(payload, userId) {
  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  const role = normalizeOptionalString(payload.role);
  const status = normalizeOptionalString(payload.status);
  const phone = normalizeOptionalString(payload.phone);
  const email = normalizeOptionalString(payload.email);
  const address = normalizeOptionalString(payload.address);
  const notes = normalizeOptionalString(payload.notes);

  if (!isNonEmptyString(name)) {
    throw createHttpError(400, "Le nom de l'employé est requis");
  }

  if (email && !isValidEmail(email)) {
    throw createHttpError(400, 'Adresse email invalide');
  }

  const createdEmployee = await employeeRepository.createEmployee({
    name,
    role,
    phone,
    userId
  });

  return {
    ...createdEmployee,
    status,
    phone,
    email: email ? email.toLowerCase() : null,
    address,
    notes
  };
}

async function deleteEmployee(id) {
  const employeeId = Number.parseInt(id, 10);

  if (Number.isNaN(employeeId) || employeeId <= 0) {
    throw createHttpError(400, 'Identifiant employé invalide');
  }

  const deletedEmployee = await employeeRepository.deleteEmployeeById(employeeId);

  if (!deletedEmployee) {
    throw createHttpError(404, 'Employé introuvable');
  }

  return deletedEmployee;
}

async function updateEmployee(id, payload) {
  const employeeId = Number.parseInt(id, 10);
  if (Number.isNaN(employeeId) || employeeId <= 0) {
    throw createHttpError(400, 'Identifiant employé invalide');
  }

  const existing = await employeeRepository.findById(employeeId);
  if (!existing) {
    throw createHttpError(404, 'Employé introuvable');
  }

  const name = typeof payload.name === 'string' && payload.name.trim() !== '' ? payload.name.trim() : existing.name;
  const role = payload.role !== undefined ? normalizeOptionalString(payload.role) : existing.role;
  const status = payload.status !== undefined ? normalizeOptionalString(payload.status) : existing.status;
  const phone = payload.phone !== undefined ? normalizeOptionalString(payload.phone) : existing.phone;
  const email = payload.email !== undefined ? normalizeOptionalString(payload.email) : existing.email;
  const address = payload.address !== undefined ? normalizeOptionalString(payload.address) : existing.address;
  const notes = payload.notes !== undefined ? normalizeOptionalString(payload.notes) : existing.notes;

  if (payload.name !== undefined && !isNonEmptyString(name)) {
    throw createHttpError(400, "Le nom de l'employé est requis");
  }

  if (email && !isValidEmail(email)) {
    throw createHttpError(400, 'Adresse email invalide');
  }

  return employeeRepository.updateEmployee(employeeId, { name, role, status, phone, email: email ? email.toLowerCase() : null, address, notes });
}

module.exports = { listEmployees, createEmployee, updateEmployee, deleteEmployee };