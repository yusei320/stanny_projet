const { withCors, parseBody } = require('../_helpers');
const db = require('../backend/database/db');
const authMiddleware = require('../backend/middleware/auth');

async function handler(req, res) {
  await parseBody(req);
  
  const authResult = await authMiddleware(req, res, () => {});
  if (res.headersSent) return;

  if (req.method === 'GET') {
    const { type } = req.query;
    try {
      const query = `
        SELECT d.*, COALESCE(c.name, pc.name) as client_name, sp.name as subproject_name, p.name as project_name
        FROM documents d
        LEFT JOIN clients c ON d.client_id = c.id
        LEFT JOIN subprojects sp ON d.subproject_id = sp.id
        LEFT JOIN projects p ON d.project_id = p.id
        LEFT JOIN clients pc ON p.client_id = pc.id
        WHERE d.type = $1
        ORDER BY d.created_at DESC
      `;
      const result = await db.query(query, [type]);
      res.json({ success: true, documents: result.rows });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Erreur lors de la récupération des documents' });
    }
  } else if (req.method === 'POST') {
    const { type, client_id, project_id, subproject_id, title, content, amount, status } = req.body;
    try {
      const query = `
        INSERT INTO documents (type, client_id, project_id, subproject_id, title, content, amount, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
      `;
      const result = await db.query(query, [type, client_id, project_id, subproject_id, title, content, amount, status || 'draft']);
      res.status(201).json({ success: true, document: result.rows[0] });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Erreur lors de la création du document' });
    }
  } else {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}

module.exports = withCors(handler);
