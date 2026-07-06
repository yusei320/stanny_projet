const { withCors, parseBody } = require('../_helpers');
const db = require('../backend/database/db');
const authMiddleware = require('../backend/middleware/auth');

async function handler(req, res) {
  await parseBody(req);
  
  const authResult = await authMiddleware(req, res, () => {});
  if (res.headersSent) return;

  const id = req.query.id;

  if (req.method === 'PUT') {
    const { subproject_id, name, category, rubriques, start_date, end_date, employees, status, description, priority, progress, budget } = req.body;
    try {
      const query = `
        UPDATE tasks SET subproject_id = $1, name = $2, category = $3, rubriques = $4, start_date = $5, end_date = $6, employees = $7, status = $8, description = $9, priority = $10, progress = $11, budget = $12, updated_at = NOW()
        WHERE id = $13
      `;
      await db.query(query, [
        subproject_id || null, 
        name, 
        category, 
        JSON.stringify(rubriques || []), 
        start_date, 
        end_date, 
        JSON.stringify(employees || []), 
        status, 
        description, 
        priority, 
        progress,
        budget,
        id
      ]);
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Erreur lors de la modification de la tâche' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const query = `DELETE FROM tasks WHERE id = $1`;
      const result = await db.query(query, [id]);
      
      if (result.rowCount === 0) {
        return res.status(404).json({ success: false, message: 'Tâche non trouvée ou non autorisée' });
      }

      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Erreur lors de la suppression de la tâche' });
    }
  } else {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}

module.exports = withCors(handler);
