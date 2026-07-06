const express = require('express');
const db = require('../database/db');
const router = express.Router();

// Récupérer toutes les tâches avec les noms des sous-projets et employés
router.get('/', async (req, res) => {
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
});

// Créer une nouvelle tâche
router.post('/', async (req, res) => {
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
});

// Mettre à jour une tâche
router.put('/:id', async (req, res) => {
  const { id } = req.params;
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
});

// Supprimer une tâche
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      DELETE FROM tasks 
      WHERE id = $1
    `;
    const result = await db.query(query, [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Tâche non trouvée ou non autorisée' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur lors de la suppression de la tâche' });
  }
});

module.exports = router;


