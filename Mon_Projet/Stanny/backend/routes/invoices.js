const express = require('express');
const db = require('../database/db');
const router = express.Router();

// Récupérer toutes les factures
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT i.*, c.name as client_name, p.name as project_name 
       FROM invoices i 
       LEFT JOIN clients c ON i.client_id = c.id 
       LEFT JOIN projects p ON i.project_id = p.id 
       ORDER BY i.created_at DESC`
    );
    const invoices = result.rows;

    // Récupérer les items pour chaque facture
    for (let invoice of invoices) {
      const itemsResult = await db.query('SELECT * FROM invoice_items WHERE invoice_id = $1', [invoice.id]);
      invoice.items = itemsResult.rows;
      invoice.total = invoice.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    }

    res.json({ success: true, invoices });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des factures' });
  }
});

// Créer une facture
router.post('/', async (req, res) => {
  try {
    const { invoice_number, client_id, project_id, issue_date, due_date, status, notes, items } = req.body;

    if (!invoice_number || !client_id || !issue_date || !due_date) {
      return res.status(400).json({ success: false, message: 'Champs requis manquants' });
    }

    // Créer la facture
    const result = await db.query(
      'INSERT INTO invoices (invoice_number, client_id, project_id, issue_date, due_date, status, notes, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
      [invoice_number, client_id, project_id, issue_date, due_date, status || 'en attente', notes, null]
    );
    const invoiceId = result.rows[0].id;

    // Ajouter les items
    if (items && items.length > 0) {
      const values = [];
      const placeholders = items.map((_, i) => {
        const offset = i * 4;
        values.push(invoiceId, items[i].description, items[i].quantity, items[i].unit_price);
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`;
      }).join(',');

      await db.query(`INSERT INTO invoice_items (invoice_id, description, quantity, unit_price) VALUES ${placeholders}`, values);
    }

    await db.query(
      'INSERT INTO history (action, details, entity_type, entity_id, user_id) VALUES ($1, $2, $3, $4, $5)',
      ['Création facture', `Nouvelle facture: ${invoice_number}`, 'invoice', invoiceId, null]
    );

    const invoiceResult = await db.query('SELECT * FROM invoices WHERE id = $1', [invoiceId]);
    const invoice = invoiceResult.rows[0];
    const invoiceItemsResult = await db.query('SELECT * FROM invoice_items WHERE invoice_id = $1', [invoiceId]);
    invoice.items = invoiceItemsResult.rows;

    res.status(201).json({ success: true, invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur' });
  }
});

// Mettre à jour une facture
router.put('/:id', async (req, res) => {
  try {
    const { client_id, project_id, issue_date, due_date, status, notes, items } = req.body;

    await db.query(
      'UPDATE invoices SET client_id = $1, project_id = $2, issue_date = $3, due_date = $4, status = $5, notes = $6 WHERE id = $7',
      [client_id, project_id, issue_date, due_date, status, notes, req.params.id]
    );

    // Mettre à jour les items
    if (items) {
      // Sécurité : Supprimer uniquement si la facture appartient à l'utilisateur
      await db.query(`
        DELETE FROM invoice_items 
        WHERE invoice_id = $1 
      `, [req.params.id]);
      
      for (let item of items) {
        await db.query('INSERT INTO invoice_items (invoice_id, description, quantity, unit_price) VALUES ($1, $2, $3, $4)',
          [req.params.id, item.description, item.quantity, item.unit_price]);
      }
    }

    const invoiceResult = await db.query('SELECT * FROM invoices WHERE id = $1', [req.params.id]);
    const invoice = invoiceResult.rows[0];
    const invoiceItemsResult = await db.query('SELECT * FROM invoice_items WHERE invoice_id = $1', [req.params.id]);
    invoice.items = invoiceItemsResult.rows;

    res.json({ success: true, invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur' });
  }
});

// Supprimer une facture
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM invoice_items WHERE invoice_id = $1', [req.params.id]);
    await db.query('DELETE FROM invoices WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Facture supprimée' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur' });
  }
});

module.exports = router;
