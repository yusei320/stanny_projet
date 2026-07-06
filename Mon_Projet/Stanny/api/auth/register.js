const { withCors, parseBody } = require('../_helpers');
const authService = require('../backend/services/authService');
const { sendSuccess } = require('../backend/utils/http');

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  await parseBody(req);
  const result = await authService.registerUser(req.body);
  return sendSuccess(res, result, 201);
}

module.exports = withCors(handler);
