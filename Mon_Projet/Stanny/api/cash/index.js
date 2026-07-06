const { withCors, parseBody } = require('../_helpers');
const db = require('../backend/database/db');
const { generateDechargePDF } = require('../backend/utils/pdfGenerator');
const authMiddleware = require('../backend/middleware/auth');

async function handler(req, res) {
  await parseBody(req);
  
  const authResult = await authMiddleware(req, res, () => {});
  if (res.headersSent) return;

  if (req.method === 'GET') {
    try {
      const query = `
        SELECT c.*,
        e.name as employee_name,
        p.name as project_name
        FROM caisse c
        LEFT JOIN employees e ON c.beneficiary_id = e.id
        LEFT JOIN projects p ON c.project_id = p.id
        ORDER BY c.date DESC, c.created_at DESC
      `;
      const result = await db.query(query);
      res.json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Erreur lors de la récupération des transactions' });
    }
  } else if (req.method === 'POST') {
    const { type, amount, beneficiary_id, beneficiary_name, project_id, date, description, payment_method } = req.body;
    try {
      const query = `
        INSERT INTO caisse (type, amount, beneficiary_id, beneficiary_name, project_id, date, description, payment_method)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
      `;
      const result = await db.query(query, [type, amount, beneficiary_id, beneficiary_name, project_id, date, description, payment_method]);
      res.status(201).json({ success: true, transaction: result.rows[0] });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Erreur lors de la création de la transaction' });
    }
  } else {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}

module.exports = withCors(handler);
