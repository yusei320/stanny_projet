const express = require('express');
const db = require('../database/db');
const { generateDechargePDF } = require('../utils/pdfGenerator');
const router = express.Router();

// Télécharger une décharge en PDF
router.get('/:id/pdf', async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      SELECT c.*, 
      e.name as employee_name,
      p.name as project_name
      FROM caisse c
      LEFT JOIN employees e ON c.beneficiary_id = e.id
      LEFT JOIN projects p ON c.project_id = p.id
      WHERE c.id = $1
    `;
    const result = await db.query(query, [id]);
    const transaction = result.rows[0];
    if (!transaction) return res.status(404).json({ message: 'Transaction non trouvée' });
    
    // On s'assure que le bénéficiaire est bien défini pour le PDF (employé ou manuel)
    transaction.display_beneficiary = transaction.employee_name || transaction.beneficiary_name || 'Non spécifié';
    
    await generateDechargePDF(transaction, res);
  } catch (error) {
    console.error('Erreur PDF Caisse:', error);
    res.status(500).json({ message: error.message || 'Erreur lors de la génération du PDF' });
  }
});

// Récupérer toutes les transactions de caisse
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT c.*,
      e.name as employee_name,
      p.name as project_name
      FROM caisse c
      LEFT JOIN employees e ON c.beneficiary_id = e.id
      LEFT JOIN projects p ON c.project_id = p.id
      ORDER BY c.date DESC, c.created_at DESC
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des transactions' });
  }
});

// Créer une nouvelle transaction
router.post('/', async (req, res) => {
  try {
    const { 
      type, amount, currency, category, date, motif, 
      project_id, subproject_id, beneficiary_id, 
      beneficiary_name_manual, beneficiary_name, payment_method, reference, status 
    } = req.body;

    // Normalisation des valeurs pour éviter les erreurs de type SQL
    const cleanAmount = (amount && !isNaN(parseFloat(amount))) ? parseFloat(amount) : 0;
    const cleanDate = (date && date.trim() !== "") ? date : new Date();
    const cleanProjectId = (project_id && project_id !== "") ? project_id : null;
    const cleanSubProjectId = (subproject_id && subproject_id !== "") ? subproject_id : null;
    const cleanBeneficiaryId = (beneficiary_id && beneficiary_id !== "") ? beneficiary_id : null;
    const cleanRef = (reference && reference.trim() !== "") ? reference : null;
    const manualName = beneficiary_name_manual || beneficiary_name;
    const cleanBeneficiaryName = (manualName && manualName.trim() !== "") ? manualName : null;

    const result = await db.query(
      `INSERT INTO caisse (
        type, amount, currency, category, date, motif, 
        project_id, subproject_id, beneficiary_id, 
        beneficiary_name, payment_method, reference, status, user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id`,
      [
        type, cleanAmount, currency || 'XAF', category, cleanDate, motif, 
        cleanProjectId, cleanSubProjectId, cleanBeneficiaryId, 
        cleanBeneficiaryName, payment_method, cleanRef, status || 'Validé', null
      ]
    );
    res.status(201).json({ success: true, id: result.rows[0].id });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de la transaction en caisse:', error);
    res.status(500).json({ success: false, message: `Détail: ${error.detail || error.message}` });
  }
});

// Supprimer une transaction
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM caisse WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Transaction non trouvée' });
    }
    res.json({ success: true, message: 'Transaction supprimée avec succès' });
  } catch (error) {
    console.error('Erreur suppression caisse:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la suppression' });
  }
});

// Mettre à jour une transaction
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { 
    type, amount, currency, category, date, motif, 
    project_id, subproject_id, beneficiary_id, 
    beneficiary_name_manual, beneficiary_name, payment_method, reference, status 
  } = req.body;

  try {
    const query = `
      UPDATE caisse SET 
        type = $1, amount = $2, currency = $3, category = $4, date = $5, motif = $6, 
        project_id = $7, subproject_id = $8, beneficiary_id = $9, 
        beneficiary_name = $10, payment_method = $11, reference = $12, status = $13,
        updated_at = NOW()
      WHERE id = $14`;

    const cleanAmount = (amount && !isNaN(parseFloat(amount))) ? parseFloat(amount) : 0;
    const cleanDate = (date && date.trim() !== "") ? date : null;
    const cleanProjectId = (project_id && project_id !== "") ? project_id : null;
    const cleanSubProjectId = (subproject_id && subproject_id !== "") ? subproject_id : null;
    const cleanBeneficiaryId = (beneficiary_id && beneficiary_id !== "") ? beneficiary_id : null;
    const manualName = beneficiary_name_manual || beneficiary_name;
    const cleanBeneficiaryName = (manualName && manualName.trim() !== "") ? manualName : null;
    const cleanRef = (reference && reference.trim() !== "") ? reference : null;

    const result = await db.query(query, [
      type, cleanAmount, currency || 'XAF', category, cleanDate, motif, 
      cleanProjectId, cleanSubProjectId, cleanBeneficiaryId, 
      cleanBeneficiaryName, payment_method, cleanRef, status, id,
    ]);
    
    if (result.rowCount === 0) {
        return res.status(404).json({ success: false, message: 'Transaction non trouvée' });
    }
    res.json({ success: true, message: 'Transaction mise à jour avec succès' });
  } catch (error) {
    console.error('Erreur modification caisse:', error);
    res.status(500).json({ success: false, message: `Détail: ${error.detail || error.message}` });
  }
});

module.exports = router;
