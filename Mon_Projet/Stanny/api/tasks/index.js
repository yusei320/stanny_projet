const { withCors, parseBody } = require('../_helpers');
const db = require('../backend/database/db');
const authMiddleware = require('../backend/middleware/auth');

async function handler(req, res) {
  await parseBody(req);
  
  const authResult = await authMiddleware(req, res, () => {});
  if (res.headersSent) return;

  if (req.method === 'GET') {
    try {
      const query = `
        SELECT t.*, sp.name as subproject_name, p.name as project_name,
        (SELECT json_agg(e.name) FROM employees e WHERE e.id::text = ANY(SELECT jsonb_array_elements_text(t.employees))) as employee_names
        FROM tasks t
        LEFT JOIN subprojects sp ON t.subproject_id = sp.id
        LEFT JOIN projects p ON sp.project_id = p.id
      `;
      const result = await db.query(query);
      res.json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Erreur lors de la récupération des tâches' });
    }
  } else if (req.method === 'POST') {
    const { subproject_id, name, category, rubriques, start_date, end_date, employees, description, progress, budget } = req.body;
    try {
      const query = `
        INSERT INTO tasks (subproject_id, name, category, rubriques, start_date, end_date, employees, description, progress, budget)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id
      `;
      const result = await db.query(query, [
        subproject_id || null, 
        name, 
        category, 
        JSON.stringify(rubriques || []), 
        start_date, 
        end_date, 
        JSON.stringify(employees || []),
        description,
        progress,
        budget
      ]);
      res.status(201).json({ success: true, id: result.rows[0].id });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Erreur lors de la création de la tâche' });
    }
  } else {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}

module.exports = withCors(handler);
