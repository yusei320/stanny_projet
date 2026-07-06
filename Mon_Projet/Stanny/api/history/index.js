const { withCors } = require('../_helpers');
const db = require('../backend/database/db');
const authMiddleware = require('../backend/middleware/auth');

async function handler(req, res) {
  const authResult = await authMiddleware(req, res, () => {});
  if (res.headersSent) return;

  if (req.method === 'GET') {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 50;
      
      const query = `
        SELECT * FROM history 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2
      `;
      const result = await db.query(query, [req.user.id, limit]);

      res.json({ success: true, history: result.rows });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Erreur lors de la récupération de l\'historique' });
    }
  } else {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}

module.exports = withCors(handler);
