const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../database/db');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

// Obtenir le profil
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT id, name, email, profile_image, bio, phone, location, 
             language, dark_mode, newsletter, two_factor_enabled, created_at 
      FROM users 
      WHERE id = $1
    `;
    const result = await db.query(query, [req.user.id]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    res.json({ success: true, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Mettre à jour le profil (SANS PSEUDO)
router.put('/', async (req, res) => {
  const { name, bio, phone, location, profile_image, language, dark_mode, newsletter, two_factor_enabled } = req.body;
  try {
    const query = `
      UPDATE users 
      SET name = COALESCE($1, name), 
          bio = COALESCE($2, bio), 
          phone = COALESCE($3, phone), 
          location = COALESCE($4, location), 
          profile_image = COALESCE($5, profile_image), 
          language = COALESCE($6, language), 
          dark_mode = COALESCE($7, dark_mode), 
          newsletter = COALESCE($8, newsletter), 
          two_factor_enabled = COALESCE($9, two_factor_enabled)
      WHERE id = $10 RETURNING *
    `;
    const result = await db.query(query, [
      name, bio, phone, location, profile_image, language, dark_mode, newsletter, two_factor_enabled, req.user.id
    ]);
    
    // Enregistrer l'historique
    await db.query('INSERT INTO history (action, details, entity_type, user_id) VALUES ($1, $2, $3, $4)', 
      ['Modification profil', 'Profil mis à jour', 'user', req.user.id]);

    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour' });
  }
});

// Changer le mot de passe (RÉELLEMENT FONCTIONNEL)
router.put('/password', async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const userResult = await db.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    const user = userResult.rows[0];

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Le mot de passe actuel est incorrect.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Le nouveau mot de passe doit faire au moins 6 caractères.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPw = await bcrypt.hash(newPassword, salt);

    await db.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPw, req.user.id]);
    
    await db.query('INSERT INTO history (action, details, entity_type, user_id) VALUES ($1, $2, $3, $4)', 
      ['Sécurité', 'Mot de passe modifié', 'user', req.user.id]);

    res.json({ success: true, message: 'Mot de passe modifié avec succès.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur lors du changement de mot de passe.' });
  }
});

// Supprimer le compte (RÉELLEMENT FONCTIONNEL)
router.delete('/', async (req, res) => {
  const userId = req.user.id;
  try {
    await db.query('BEGIN');
    await db.query(`TRUNCATE TABLE fiche_fin_travaux, documents, caisse, tasks, subprojects, projects, clients, history, settings, users RESTART IDENTITY CASCADE`);
    await db.query('COMMIT');
    res.json({ success: true, message: 'Votre compte a été supprimé définitivement.' });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur lors de la suppression du compte.' });
  }
});

// Obtenir les statistiques de l'utilisateur
router.get('/stats', async (req, res) => {
  try {
    const stats = {};
    const userId = req.user.id;
    const projectsRes = await db.query('SELECT COUNT(*) as total FROM projects WHERE user_id = $1', [userId]);
    stats.projects = projectsRes.rows[0].total;
    const tasksRes = await db.query('SELECT COUNT(*) as total FROM tasks t JOIN subprojects sp ON t.subproject_id = sp.id JOIN projects p ON sp.project_id = p.id WHERE p.user_id = $1', [userId]);
    stats.tasks = tasksRes.rows[0].total;
    const clientsRes = await db.query('SELECT COUNT(*) as total FROM clients WHERE user_id = $1', [userId]);
    stats.clients = clientsRes.rows[0].total;
    const invoicesRes = await db.query(`
      SELECT COUNT(*) as total, SUM(total_amount) as revenue 
      FROM documents WHERE type = 'facture' AND user_id = $1
    `, [userId]);
    stats.invoices = invoicesRes.rows[0].total;
    stats.revenue = invoicesRes.rows[0].revenue || 0;
    const userRes = await db.query('SELECT created_at, name, email FROM users WHERE id = $1', [userId]);
    stats.memberSince = userRes.rows[0].created_at;
    stats.userInfo = { name: userRes.rows[0].name, email: userRes.rows[0].email };
    res.json({ success: true, stats });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur stats' });
  }
});

module.exports = router;
