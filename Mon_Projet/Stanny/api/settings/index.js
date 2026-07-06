const { withCors, parseBody } = require('../_helpers');
const db = require('../backend/database/db');
const authMiddleware = require('../backend/middleware/auth');

async function handler(req, res) {
  await parseBody(req);
  
  const authResult = await authMiddleware(req, res, () => {});
  if (res.headersSent) return;

  if (req.method === 'GET') {
    try {
      const query = 'SELECT key, value FROM settings WHERE user_id = $1';
      const result = await db.query(query, [req.user.id]);
      const settings = result.rows;

      const settingsObj = {};
      settings.forEach(s => {
        try {
          settingsObj[s.key] = JSON.parse(s.value);
        } catch (e) {
          settingsObj[s.key] = s.value;
        }
      });

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
      console.error(error);
      res.status(500).json({ success: false, message: 'Erreur lors de la récupération des paramètres' });
    }
  } else if (req.method === 'PUT') {
    const { key, value } = req.body;
    try {
      const query = `
        INSERT INTO settings (user_id, key, value) 
        VALUES ($1, $2, $3) 
        ON CONFLICT (user_id, key) DO UPDATE SET value = $3
      `;
      await db.query(query, [req.user.id, key, JSON.stringify(value)]);
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour des paramètres' });
    }
  } else {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}

module.exports = withCors(handler);
