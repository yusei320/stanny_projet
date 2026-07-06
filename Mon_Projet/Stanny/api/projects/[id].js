const { withCors, parseBody } = require('../_helpers');
const db = require('../backend/database/db');
const authMiddleware = require('../backend/middleware/auth');

const nullIfEmpty = (val) => (val && val !== "" ? val : null);

async function handler(req, res) {
  await parseBody(req);
  
  const authResult = await authMiddleware(req, res, () => {});
  if (res.headersSent) return;

  const id = req.query.id;

  if (req.method === 'PUT') {
    const { client_id, name, start_date, end_date, subprojects, category, manager, budget, status, priority, progress, description } = req.body;
    
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        'UPDATE projects SET client_id = $1, name = $2, start_date = $3, end_date = $4, category = $5, manager = $6, budget = $7, status = $8, progress = $9, priority = $10, description = $11, updated_at = NOW() WHERE id = $12',
        [
          nullIfEmpty(client_id),
          name,
          nullIfEmpty(start_date),
          nullIfEmpty(end_date),
          category,
          manager,
          budget,
          status,
          progress,
          priority,
          description,
          id
        ]
      );

      if (subprojects) {
        await client.query('DELETE FROM subprojects WHERE project_id = $1 AND name != ALL($2)', [id, subprojects]);
        for (const spName of subprojects) {
          await client.query(
            'INSERT INTO subprojects (project_id, name, start_date, end_date) VALUES ($1, $2, $3, $4) ON CONFLICT (project_id, name) DO NOTHING',
            [id, spName, nullIfEmpty(start_date), nullIfEmpty(end_date)]
          );
        }
      }
      
      await client.query('COMMIT');
      res.json({ success: true });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(error);
      res.status(500).json({ success: false, message: 'Erreur lors de la modification du projet' });
    } finally {
      client.release();
    }
  } else if (req.method === 'DELETE') {
    try {
      await db.query('DELETE FROM caisse WHERE project_id = $1', [id]);
      await db.query('DELETE FROM documents WHERE project_id = $1', [id]);
      await db.query('DELETE FROM projects WHERE id = $1', [id]);
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Erreur lors de la suppression du projet' });
    }
  } else {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}

module.exports = withCors(handler);
