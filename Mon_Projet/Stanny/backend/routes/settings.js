const express = require('express');
const db = require('../database/db');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

// Obtenir tous les paramètres
router.get('/', async (req, res) => {
  try {
    const query = 'SELECT key, value FROM settings WHERE user_id = $1';
    const result = await db.query(query, [req.user.id]);
    const settings = result.rows;

    // Convertir en objet
    const settingsObj = {};
    settings.forEach(s => {
      try {
        settingsObj[s.key] = JSON.parse(s.value);
      } catch (e) {
        settingsObj[s.key] = s.value;
      }
    });

    // Paramètres par défaut si aucun n'existe
    const defaultSettings = {
      currency: 'XAF',
      dateFormat: 'dd/MM/yyyy',
      language: 'fr',
      notifications: {
        email: true,
        push: false,
        taskReminders: true,
        invoiceReminders: true
      },
      display: {
        theme: 'light',
        compactMode: false,
        sidebarCollapsed: false
      },
      invoice: {
        prefix: 'INV',
        startNumber: 1,
        taxRate: 0,
        footer: 'Merci pour votre confiance'
      }
    };

    res.json({ 
      success: true, 
      settings: { ...defaultSettings, ...settingsObj }
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des paramètres' });
  }
});

// Mettre à jour plusieurs paramètres d'un coup
router.post('/', async (req, res) => {
  try {
    const settings = req.body;
    const userId = req.user.id;
    console.log(`[SETTINGS] Tentative de mise à jour groupée pour l'utilisateur ${userId}`);
    console.log(`[SETTINGS] Données reçues :`, settings);
    
    const queries = [];

    for (const [key, value] of Object.entries(settings)) {
      const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
      const query = `
        INSERT INTO settings (user_id, key, value)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, key)
        DO UPDATE SET value = EXCLUDED.value
      `;
      queries.push(db.query(query, [req.user.id, key, valueStr]));
    }

    await Promise.all(queries);

    // Enregistrer dans l'historique
    const historyQuery = 'INSERT INTO history (action, details, entity_type, user_id) VALUES ($1, $2, $3, $4)';
    await db.query(historyQuery, ['Modification paramètres', 'Mise à jour groupée des paramètres', 'settings', req.user.id]);

    res.json({ 
      success: true, 
      message: 'Tous les paramètres ont été mis à jour avec succès' 
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour groupée' });
  }
});

// Mettre à jour un paramètre
router.put('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value);

    const query = `
      INSERT INTO settings (user_id, key, value)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, key)
      DO UPDATE SET value = EXCLUDED.value
    `;
    await db.query(query, [req.user.id, key, valueStr]);

    // Enregistrer dans l'historique
    const historyQuery = 'INSERT INTO history (action, details, entity_type, user_id) VALUES ($1, $2, $3, $4)';
    await db.query(historyQuery, ['Modification paramètres', `Paramètre "${key}" modifié`, 'settings', req.user.id]);

    res.json({ 
      success: true, 
      message: 'Paramètre mis à jour avec succès' 
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour du paramètre' });
  }
});

module.exports = router;
