const clientService = require('../services/clientService');
const { sendSuccess } = require('../utils/http');

async function getClients(req, res) {
  const clients = await clientService.listClients();
  return sendSuccess(res, clients);
}

async function createClient(req, res) {
  const client = await clientService.createClient(req.body);
  return sendSuccess(res, client, 201);
}

async function updateClient(req, res) {
  const client = await clientService.updateClient(req.params.id, req.body);
  return sendSuccess(res, client);
}

async function deleteClient(req, res) {
  await clientService.deleteClient(req.params.id);
  return sendSuccess(res, { message: 'Client supprimé avec succès' });
}

module.exports = { getClients, createClient, updateClient, deleteClient };