const { withCors, parseBody } = require('../_helpers');
const clientController = require('../backend/controllers/clientController');
const authMiddleware = require('../backend/middleware/auth');

async function handler(req, res) {
  await parseBody(req);
  
  // Mock auth middleware for serverless
  const authResult = await authMiddleware(req, res, () => {});
  if (res.headersSent) return;

  req.params = { id: req.query.id };

  if (req.method === 'PUT') {
    return clientController.updateClient(req, res);
  } else if (req.method === 'DELETE') {
    return clientController.deleteClient(req, res);
  } else {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}

module.exports = withCors(handler);
