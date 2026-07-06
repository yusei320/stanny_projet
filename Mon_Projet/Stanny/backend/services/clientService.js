const clientRepository = require('../repositories/clientRepository');
const { createHttpError } = require('../utils/http');
const {
  isNonEmptyString,
  normalizeOptionalString,
  isValidEmail
} = require('../utils/validators');

async function listClients() {
  return clientRepository.findAllClients();
}

async function createClient(payload) {
  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  const email = normalizeOptionalString(payload.email);
  const phone = normalizeOptionalString(payload.phone);
  const address = normalizeOptionalString(payload.address);
  const company = normalizeOptionalString(payload.company);
  const notes = normalizeOptionalString(payload.notes);

  if (!isNonEmptyString(name)) {
    throw createHttpError(400, 'Le nom du client est requis');
  }

  if (email && !isValidEmail(email)) {
    throw createHttpError(400, 'Adresse email invalide');
  }

  return clientRepository.createClient({
    name,
    email: email ? email.toLowerCase() : null,
    phone,
    address,
    company,
    notes
  });
}

async function updateClient(id, payload) {
  const existing = await clientRepository.findById(id);
  if (!existing) {
    throw createHttpError(404, 'Client non trouvé');
  }

  const name = typeof payload.name === 'string' ? payload.name.trim() : existing.name;
  const email = payload.email !== undefined ? normalizeOptionalString(payload.email) : existing.email;
  const phone = payload.phone !== undefined ? normalizeOptionalString(payload.phone) : existing.phone;
  const address = payload.address !== undefined ? normalizeOptionalString(payload.address) : existing.address;
  const company = payload.company !== undefined ? normalizeOptionalString(payload.company) : existing.company;
  const notes = payload.notes !== undefined ? normalizeOptionalString(payload.notes) : existing.notes;

  if (payload.name !== undefined && !isNonEmptyString(name)) {
    throw createHttpError(400, 'Le nom du client est requis');
  }

  if (email && email !== existing.email && !isValidEmail(email)) {
    throw createHttpError(400, 'Adresse email invalide');
  }

  return clientRepository.updateClient(id, {
    name,
    email: email ? email.toLowerCase() : null,
    phone,
    address,
    company,
    notes
  });
}

async function deleteClient(id) {
  const existing = await clientRepository.findById(id);
  if (!existing) {
    throw createHttpError(404, 'Client non trouvé');
  }

  return clientRepository.deleteClient(id);
}

module.exports = { listClients, createClient, updateClient, deleteClient };