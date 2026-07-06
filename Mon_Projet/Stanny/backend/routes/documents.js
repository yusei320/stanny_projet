const express = require('express');
const db = require('../database/db');
const { generatePDF, generateFicheTravauxPDF } = require('../utils/pdfGenerator');

const router = express.Router();

// Télécharger un document en PDF
router.get('/:id/pdf', async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      SELECT d.*, COALESCE(c.name, pc.name) as client_name, sp.name as subproject_name, p.name as project_name
      FROM documents d
      LEFT JOIN clients c ON d.client_id = c.id
      LEFT JOIN subprojects sp ON d.subproject_id = sp.id
      LEFT JOIN projects p ON d.project_id = p.id
      LEFT JOIN clients pc ON p.client_id = pc.id
      WHERE d.id = $1
    `;
    const result = await db.query(query, [id]);
    const doc = result.rows[0];
    
    if (!doc) return res.status(404).json({ message: 'Document non trouvé' });

    if (doc.type === 'fiche_travaux') {
      generateFicheTravauxPDF(doc, res);
    } else {
      generatePDF(doc.type, doc, res);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la génération du PDF' });
  }
});

// Récupérer les documents par type
router.get('/', async (req, res) => {
  const { type } = req.query;
  try {
    const query = `
      SELECT d.*, COALESCE(c.name, pc.name) as client_name, sp.name as subproject_name, p.name as project_name
      FROM documents d
      LEFT JOIN clients c ON d.client_id = c.id
      LEFT JOIN subprojects sp ON d.subproject_id = sp.id
      LEFT JOIN projects p ON d.project_id = p.id
      LEFT JOIN clients pc ON p.client_id = pc.id
      WHERE d.type = $1
      ORDER BY d.created_at DESC
    `;
    const result = await db.query(query, [type]);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des documents' });
  }
});

// Créer un nouveau document
router.post('/', async (req, res) => {
  const { type, client_id, subproject_id, project_id, location, responsible_tech, object, items, tva, remise, centime_additionnel, total_amount, currency, total_in_words, date } = req.body;
  
  try {
    const settings = {};

    // 2. Générer le numéro du document
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    
    // Utiliser le préfixe et le numéro de départ des réglages
    const customPrefix = settings.invoicePrefix || 'IT';
    const startNum = parseInt(settings.invoiceStartNumber) || 1;

    // Chercher le plus grand numéro existant pour ce type afin d'éviter les doublons
    const maxQuery = `
      SELECT number FROM documents WHERE type = $1
      ORDER BY id DESC LIMIT 1
    `;
    const maxResult = await db.query(maxQuery, [type]);
    let seqNum = startNum;
    if (maxResult.rows.length > 0) {
      const lastNumber = maxResult.rows[0].number || '';
      const lastSeq = parseInt(lastNumber.split('/')[0]) || 0;
      seqNum = Math.max(startNum, lastSeq + 1);
    }

    // Boucle de sécurité : incrémenter jusqu'à trouver un numéro libre
    let number;
    let tries = 0;
    while (tries < 100) {
      const candidate = `${String(seqNum).padStart(3, '0')}/${customPrefix}${month}${year}`;
      const exists = await db.query(`SELECT id FROM documents WHERE number = $1`, [candidate]);
      if (exists.rows.length === 0) {
        number = candidate;
        break;
      }
      seqNum++;
      tries++;
    }
    if (!number) throw new Error('Impossible de générer un numéro unique pour ce document');

    // 3. Utiliser la devise par défaut si non fournie
    const finalCurrency = currency || settings.currency || 'XAF';

    const query = `
      INSERT INTO documents (type, client_id, subproject_id, project_id, location, responsible_tech, number, object, items, tva, remise, centime_additionnel, total_amount, currency, total_in_words, date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, COALESCE($16, CURRENT_DATE)) RETURNING *
    `;
    const result = await db.query(query, [
      type, client_id || null, subproject_id || null, project_id || null, location || null, responsible_tech || null, number, object, JSON.stringify(items || []), 
      tva || 0, remise || 0, centime_additionnel || 0, total_amount || 0, finalCurrency, total_in_words || null, date || null
    ]);
    res.status(201).json({ success: true, id: result.rows[0].id, number: result.rows[0].number });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: `Erreur lors de la création du document: ${error.message}` });
  }
});

// Convertir un devis en facture
router.post('/:id/convert', async (req, res) => {
  const { id } = req.params;
  try {
    // Récupérer le devis en vérifiant l'utilisateur
    const queryDevis = `SELECT * FROM documents WHERE id = $1 AND type = 'devis'`;
    const resultDevis = await db.query(queryDevis, [id]);
    const devis = resultDevis.rows[0];
    
    if (!devis) {
      return res.status(404).json({ success: false, message: 'Devis non trouvé' });
    }
    
    if (devis.status === 'converted') {
      return res.status(400).json({ success: false, message: 'Ce devis a déjà été converti' });
    }
    
    // Générer un nouveau numéro pour la facture
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    
    // Obtenir le nombre de factures
    const countQuery = `SELECT COUNT(*) FROM documents WHERE type = 'facture'`;
    const countResult = await db.query(countQuery);
    const seq = String(parseInt(countResult.rows[0].count) + 1).padStart(3, '0');
    
    const number = `${seq}/FA${month}${year}`;
    
    // Créer la facture à partir des données du devis
    const queryFacture = `
      INSERT INTO documents (type, client_id, subproject_id, number, object, items, tva, remise, centime_additionnel, total_amount, currency, total_in_words, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id
    `;
    const resultFacture = await db.query(queryFacture, [
      'facture', devis.client_id, devis.subproject_id, number, devis.object, devis.items, 
      devis.tva, devis.remise, devis.centime_additionnel, devis.total_amount, devis.currency, devis.total_in_words, 'pending'
    ]);
    
    // Mettre à jour le statut du devis
    await db.query(`UPDATE documents SET status = 'converted' WHERE id = $1`, [id]);
    
    res.status(201).json({ 
      success: true, 
      message: 'Devis converti en facture avec succès',
      invoice_id: resultFacture.rows[0].id,
      invoice_number: number
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur lors de la conversion du devis' });
  }
});

// Modifier un document
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { client_id, subproject_id, project_id, location, responsible_tech, object, items, tva, remise, centime_additionnel, total_amount, total_in_words, status, date } = req.body;
  
  try {
    const cleanClientId = (client_id && client_id !== "") ? client_id : null;
    const cleanSubProjectId = (subproject_id && subproject_id !== "") ? subproject_id : null;
    const cleanProjectId = (project_id && project_id !== "") ? project_id : null;

    const query = `
      UPDATE documents 
      SET client_id = $1, subproject_id = $2, object = $3, items = $4, tva = $5, 
          remise = $6, centime_additionnel = $7, total_amount = $8, total_in_words = $9, 
          status = $10, project_id = $11, location = $12, responsible_tech = $13, date = COALESCE($14, date), updated_at = CURRENT_TIMESTAMP
      WHERE id = $15 RETURNING *
    `;
    const result = await db.query(query, [
      cleanClientId,
      cleanSubProjectId,
      object,
      JSON.stringify(items || []),
      tva || 0,
      remise || 0,
      centime_additionnel || 0,
      total_amount || 0,
      total_in_words || null,
      status || 'pending',
      cleanProjectId,
      location || null,
      responsible_tech || null,
      date || null,
      id
    ]);
    
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Document non trouvé' });
    res.json({ success: true, document: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur lors de la modification du document' });
  }
});

// Supprimer un document
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM documents WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Document non trouvé' });
    res.json({ success: true, message: 'Document supprimé avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur lors de la suppression' });
  }
});

module.exports = router;
