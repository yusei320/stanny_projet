const { withCors, parseBody } = require('../_helpers');
const db = require('../backend/database/db');
const authMiddleware = require('../backend/middleware/auth');

async function handler(req, res) {
  await parseBody(req);
  
  const authResult = await authMiddleware(req, res, () => {});
  if (res.headersSent) return;

  if (req.method === 'GET') {
    try {
      const result = await db.query(
        `SELECT i.*, c.name as client_name, p.name as project_name 
         FROM invoices i 
         LEFT JOIN clients c ON i.client_id = c.id 
         LEFT JOIN projects p ON i.project_id = p.id 
         ORDER BY i.created_at DESC`
      );
      const invoices = result.rows;

      for (let invoice of invoices) {
        const itemsResult = await db.query('SELECT * FROM invoice_items WHERE invoice_id = $1', [invoice.id]);
        invoice.items = itemsResult.rows;
        invoice.total = invoice.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
      }

      res.json({ success: true, invoices });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Erreur lors de la récupération des factures' });
    }
  } else if (req.method === 'POST') {
    const { invoice_number, client_id, project_id, issue_date, due_date, status, notes, items } = req.body;

    if (!invoice_number || !client_id || !issue_date || !due_date) {
      return res.status(400).json({ success: false, message: 'Champs requis manquants' });
    }

    try {
      const result = await db.query(
        'INSERT INTO invoices (invoice_number, client_id, project_id, issue_date, due_date, status, notes, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
        [invoice_number, client_id, project_id, issue_date, due_date, status || 'en attente', notes, req.user?.id || null]
      );
      const invoiceId = result.rows[0].id;

      if (items && items.length > 0) {
        const values = [];
        const placeholders = items.map((_, i) => {
          const offset = i * 4;
          values.push(items[i].description, items[i].quantity, items[i].unit_price, invoiceId);
          return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`;
        }).join(', ');

        await db.query(
          `INSERT INTO invoice_items (description, quantity, unit_price, invoice_id) VALUES ${placeholders}`,
          values
        );
      }

      res.status(201).json({ success: true, id: invoiceId });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Erreur lors de la création de la facture' });
    }
  } else {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}

module.exports = withCors(handler);
