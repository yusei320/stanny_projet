const { withCors, parseBody } = require('../_helpers');
const db = require('../backend/database/db');
const bcrypt = require('bcryptjs');
const authMiddleware = require('../backend/middleware/auth');

async function handler(req, res) {
  await parseBody(req);
  
  const authResult = await authMiddleware(req, res, () => {});
  if (res.headersSent) return;

  if (req.method === 'GET') {
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
  } else if (req.method === 'PUT') {
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
      
      await db.query('INSERT INTO history (action, details, entity_type, user_id) VALUES ($1, $2, $3, $4)', 
        ['Mise à jour profil', 'Profil utilisateur mis à jour', 'user', req.user.id]);
      
      res.json({ success: true, user: result.rows[0] });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour du profil' });
    }
  } else {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}

module.exports = withCors(handler);
