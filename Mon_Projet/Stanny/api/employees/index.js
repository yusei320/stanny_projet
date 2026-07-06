const { withCors, parseBody } = require('../_helpers');
const employeeController = require('../backend/controllers/employeeController');
const authMiddleware = require('../backend/middleware/auth');

async function handler(req, res) {
  await parseBody(req);
  
  const authResult = await authMiddleware(req, res, () => {});
  if (res.headersSent) return;

  if (req.method === 'GET') {
    return employeeController.getEmployees(req, res);
  } else if (req.method === 'POST') {
    return employeeController.createEmployee(req, res);
  } else {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}

module.exports = withCors(handler);
