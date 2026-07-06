const { withCors, parseBody } = require('../_helpers');
const db = require('../backend/database/db');
const authMiddleware = require('../backend/middleware/auth');

const nullIfEmpty = (val) => (val && val !== "" ? val : null);

async function handler(req, res) {
  await parseBody(req);
  
  const authResult = await authMiddleware(req, res, () => {});
  if (res.headersSent) return;

  if (req.method === 'GET') {
    try {
      const query = `
        SELECT p.*, c.name as client_name,
        (SELECT json_agg(sp) FROM subprojects sp WHERE sp.project_id = p.id) as subprojects
        FROM projects p
        LEFT JOIN clients c ON p.client_id = c.id
        ORDER BY p.created_at DESC
      `;
      const result = await db.query(query);
      res.json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Erreur lors de la récupération des projets' });
    }
  } else if (req.method === 'POST') {
    const client = await db.pool.connect();
    try {
      const { client_id, name, start_date, end_date, subprojects, category, manager, budget, status, priority, progress, description } = req.body;
      await client.query('BEGIN');
      
      const projectResult = await client.query(
        'INSERT INTO projects (client_id, name, start_date, end_date, category, manager, budget, status, priority, progress, description) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id',
        [
          nullIfEmpty(client_id),
          name,
          nullIfEmpty(start_date),
          nullIfEmpty(end_date),
          category,
          manager,
          budget,
          status || 'En cours',
          priority || 'Moyenne',
          progress || 0,
          description
        ]
      );
      
      const projectId = projectResult.rows[0].id;
      
      if (subprojects && subprojects.length > 0) {
        for (const spName of subprojects) {
          await client.query(
            'INSERT INTO subprojects (project_id, name, start_date, end_date) VALUES ($1, $2, $3, $4)',
            [projectId, spName, start_date, end_date]
          );
        }
      }
      
      await client.query('COMMIT');
      res.status(201).json({ success: true, id: projectId });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(error);
      res.status(500).json({ success: false, message: 'Erreur lors de la création du projet' });
    } finally {
      client.release();
    }
  } else {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}

module.exports = withCors(handler);
