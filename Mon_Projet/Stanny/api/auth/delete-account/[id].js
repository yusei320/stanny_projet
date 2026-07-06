const { withCors } = require('../../_helpers');
const userRepository = require('../../backend/repositories/userRepository');

async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { id } = req.query;
  const success = await userRepository.deleteUserAndData(id);
  
  if (success) {
    res.json({ success: true, message: "Compte et données associés supprimés." });
  } else {
    res.status(404).json({ success: false, message: "Utilisateur non trouvé." });
  }
}

module.exports = withCors(handler);
