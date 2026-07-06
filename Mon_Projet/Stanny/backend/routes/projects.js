const express = require('express');
const db = require('../database/db');
const router = express.Router();

// Récupérer tous les projets avec leurs sous-projets et le nom du client
// Helper pour nettoyer les entrées vides
const nullIfEmpty = (val) => (val && val !== "" ? val : null);

router.get('/', async (req, res) => {
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
});

// Créer un nouveau projet avec ses sous-projets
router.post('/', async (req, res) => {
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
});

// Mettre à jour un projet
router.put('/:id', async (req, res) => {
  const { id } = req.params;
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
      // On synchronise les sous-projets : on supprime ceux qui ne sont plus dans la liste et on ajoute les nouveaux
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
});

// Supprimer un projet et toutes ses données liées
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Supprimer les entrées de caisse liées au projet
    await db.query('DELETE FROM caisse WHERE project_id = $1', [id]);
    
    // 2. Supprimer les documents liés au projet (Ajouté pour éviter le blocage)
    await db.query('DELETE FROM documents WHERE project_id = $1', [id]);
    
    // 3. Supprimer le projet en lui-même
    await db.query('DELETE FROM projects WHERE id = $1', [id]);
    
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur lors de la suppression du projet' });
  }
});


module.exports = router;