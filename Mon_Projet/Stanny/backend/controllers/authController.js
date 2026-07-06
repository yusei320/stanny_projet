const authService = require('../services/authService');
const { sendSuccess } = require('../utils/http');
const userRepository = require('../repositories/userRepository');

async function register(req, res) {
  const result = await authService.registerUser(req.body);
  return sendSuccess(res, result, 201);
}

async function login(req, res) {
  const result = await authService.loginUser(req.body);
  return sendSuccess(res, result);
}

async function deleteAccount(req, res) {
  const { id } = req.params;
  const success = await userRepository.deleteUserAndData(id);
  
  if (success) {
    res.json({ success: true, message: "Compte et données associés supprimés." });
  } else {
    res.status(404).json({ success: false, message: "Utilisateur non trouvé." });
  }
}

module.exports = { register, login, deleteAccount };