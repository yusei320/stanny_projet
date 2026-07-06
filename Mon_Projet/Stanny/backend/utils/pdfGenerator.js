const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generatePDF = (docType, data, res) => {
  // Use a standard A4 page with 45pt margins
  const doc = new PDFDocument({ margin: 45, size: 'A4', bufferPages: true });
  
  const filename = `${docType}_${data.number || Date.now()}.pdf`;
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/pdf');

  doc.pipe(res);

  // ─── 1. LOGO (Moved to the absolute physical TOP Y=5) ─────────
  const logoPaths = [
    path.join(__dirname, '../../frontend/assets/img/logo.png.jpg'),
    path.join(__dirname, '../../frontend/assets/img/logo.png'),
    path.join(__dirname, '../../frontend/assets/img/logo.jpg'),
    path.join(__dirname, '../logo.png'),
    path.join(__dirname, '../logo.jpg')
  ];
  
  let foundLogo = false;
  for(let lp of logoPaths) {
    try {
      if (fs.existsSync(lp)) {
        doc.image(lp, 45, 5, { width: 175 }); // Absolute top Y=5
        foundLogo = true;
        break;
      }
    } catch (e) { console.error("Error loading logo:", e.message); }
  }
  
  if (!foundLogo) {
    doc.fontSize(26).fillColor('#000').font('Helvetica-Bold').text('STATCOM', 45, 10, { continued: true });
    doc.fontSize(26).fillColor('#888').font('Helvetica').text(' SERVICES');
  }

  // ─── 2. DATE & CLIENT (Final Precision Positioning) ───────────
  const topRightX = 350;
  const topRightW = 200;
  doc.fontSize(11).fillColor('#000').font('Helvetica-Bold'); // Changed to Bold
  // Date pushed lower (120)
  doc.text(`Date : ${new Date(data.date || Date.now()).toLocaleDateString('fr-FR')}`, topRightX, 120, { align: 'right', width: topRightW });
  
  doc.moveDown(4); 
  doc.fontSize(12).font('Helvetica-Bold');
  // Shift Client even further right (370)
  const clientX = 370; 
  doc.text(`Client : ${data.client_name || '................'}`, clientX, doc.y, { align: 'left', width: 250 });

  doc.moveDown(5); 

  // ─── 3. MAIN TITLE ──────────────────────────────────────────────
  const docTitle = docType === 'facture' ? 'FACTURE' : (docType === 'devis' ? 'DEVIS' : docType.toUpperCase());
  doc.fillColor('#000').fontSize(16).font('Helvetica-Bold').text(`${docTitle} N°${data.number || '................'}`, 45, doc.y, { align: 'left' });
  
  doc.moveDown(1.5);
  
  // ─── 4. OBJECT ──────────────────────────────────────────────────
  doc.fontSize(11).font('Helvetica-Bold').text('Objet : ', { continued: true });
  doc.font('Helvetica').text(data.object || '................');
  
  doc.moveDown(1.5);

  // ─── 5. TABLE (Excel Grid Style) ────────────────────────────────
  const tableTop = doc.y;
  const col1 = 45, col2 = 345, col3 = 410, col4 = 490;
  const tableWidth = 510;
  const colWidths = [300, 65, 80, 65];

  // Table header row function
  const headerHeight = 22;
  const drawTableHeader = (y) => {
    doc.lineWidth(1).strokeColor('#000');
    doc.rect(col1, y, tableWidth, headerHeight).stroke();
    doc.moveTo(col2, y).lineTo(col2, y + headerHeight).stroke();
    doc.moveTo(col3, y).lineTo(col3, y + headerHeight).stroke();
    doc.moveTo(col4, y).lineTo(col4, y + headerHeight).stroke();
    doc.font('Helvetica-Bold').fontSize(11);
    doc.text('Désignations', col1, y + 6, { width: colWidths[0], align: 'center' });
    doc.text('Qté', col2, y + 6, { width: colWidths[1], align: 'center' });
    doc.text('PU', col3, y + 6, { width: colWidths[2], align: 'center' });
    doc.text('Total', col4, y + 6, { width: colWidths[3], align: 'center' });
    doc.font('Helvetica').fontSize(10);
    return y + headerHeight;
  };

  let currentY = drawTableHeader(tableTop);
  
  const items = (typeof data.items === 'string' ? JSON.parse(data.items) : data.items) || [];
  
  items.forEach(item => {
    const text = item.description || item.designation || '';
    const textHeight = doc.heightOfString(text, { width: colWidths[0] - 16 });
    const rowHeight = Math.max(22, textHeight + 14); // 7px padding top and bottom

    if (currentY + rowHeight > 650) {
      doc.addPage();
      currentY = 45;
      currentY = drawTableHeader(currentY);
    }

    doc.rect(col1, currentY, tableWidth, rowHeight).stroke();
    doc.moveTo(col2, currentY).lineTo(col2, currentY + rowHeight).stroke();
    doc.moveTo(col3, currentY).lineTo(col3, currentY + rowHeight).stroke();
    doc.moveTo(col4, currentY).lineTo(col4, currentY + rowHeight).stroke();

    doc.text(text, col1 + 8, currentY + 7, { width: colWidths[0] - 16 });
    doc.text((item.quantity || item.qty || '0').toString(), col2, currentY + 7, { width: colWidths[1], align: 'center' });
    doc.text(Number(item.unit_price || item.pu || 0).toLocaleString('fr-FR').replace(/[\s\u202f\u00a0]/g, ' '), col3, currentY + 7, { width: colWidths[2], align: 'center' });
    doc.text(Number(item.total || 0).toLocaleString('fr-FR').replace(/[\s\u202f\u00a0]/g, ' '), col4, currentY + 7, { width: colWidths[3], align: 'center' });
    
    currentY += rowHeight;
  });

  // Footer Total Row
  const totalRowHeight = 24;
  if (currentY + totalRowHeight > 650) {
      doc.addPage();
      currentY = 45;
  }
  doc.rect(col1, currentY, tableWidth, totalRowHeight).stroke();
  doc.moveTo(col2, currentY).lineTo(col2, currentY + totalRowHeight).stroke();
  doc.moveTo(col3, currentY).lineTo(col3, currentY + totalRowHeight).stroke();
  doc.moveTo(col4, currentY).lineTo(col4, currentY + totalRowHeight).stroke();

  doc.font('Helvetica-Bold');
  doc.text('Total', col1, currentY + 7, { width: colWidths[0], align: 'center' });
  doc.text(Number(data.total_amount || 0).toLocaleString('fr-FR').replace(/[\s\u202f\u00a0]/g, ' '), col4, currentY + 7, { width: colWidths[3], align: 'center' });

  currentY += 45; // Slightly closer as requested

  // ─── 6. AMOUNT IN WORDS ─────────────────────────────────────────
  if (currentY + 50 > 680) { // If no space for text and signature
      doc.addPage();
      currentY = 45;
  }
  doc.x = 45; 
  doc.y = currentY;
  doc.fontSize(11).font('Helvetica').fillColor('#000');
  const typeLabel = docType === 'facture' ? 'facture' : 'devis';
  
  const textWords = `Arrêter le présent ${typeLabel} à la somme de Francs CFA : `;
  doc.text(textWords, { continued: true });
  doc.font('Helvetica-Bold').text(`${data.total_in_words || ''}`, { width: 510 });

  // ─── 7. SIGNATURE BLOCK ─────────────────────────────────────────
  const sigX = 380;
  const sigY = doc.y > 690 ? doc.y + 20 : 690; 
  doc.fillColor('#000').fontSize(11).font('Helvetica-Bold').text('Francis KINZONZI', sigX, sigY, { align: 'left' });
  doc.font('Helvetica-Bold').fontSize(10).text('Responsable Technique', sigX, sigY + 15, { align: 'left' });

  // ─── 8. BOTTOM FOOTER ───────────────────────────────────────────
  // Note: the footer should be printed on EVERY page of the PDF
  const pages = doc.bufferedPageRange ? doc.bufferedPageRange() : { count: 1 };
  const numPages = doc._pageBuffer ? doc._pageBuffer.length : 1;
  
  for(let i = 0; i < numPages; i++) {
    doc.switchToPage ? doc.switchToPage(i) : null;
    const footerBase = 750;
    doc.lineWidth(1.5).strokeColor('#000').moveTo(45, footerBase).lineTo(555, footerBase).stroke();
    
    const footY = footerBase + 10;
    doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#000');
    doc.text('Adresse 38, Rue Laguë plateau – Tél : 06 578 62 23 / 06 672 70 59', 45, footY, { align: 'center', width: 510 });
    doc.text('RCCM CG/BZV/17 A 22310 NIU: P201711000745213 UBA: 90101600722 BCH: 10120001652', 45, footY + 10, { align: 'center', width: 510 });
    doc.text('Régime d\'imposition : Forfaitaire- Résidence Fiscale : Ouenze', 45, footY + 20, { align: 'center', width: 510 });
  }

  doc.end();
};

const generateDechargePDF = (data, res) => {
  const doc = new PDFDocument({ margin: 45, size: 'A4' });
  const filename = `decharge_${data.id || Date.now()}.pdf`;
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/pdf');
  doc.pipe(res);

  // 1. LOGO (Recherche flexible comme dans les factures)
  const logoPaths = [
    path.join(__dirname, '../../frontend/assets/img/logo.png.jpg'),
    path.join(__dirname, '../../frontend/assets/img/logo.png'),
    path.join(__dirname, '../../frontend/assets/img/logo.jpg'),
    path.join(__dirname, '../logo.png'),
    path.join(__dirname, '../logo.jpg')
  ];
  
  let foundLogo = false;
  for(let lp of logoPaths) {
    if (fs.existsSync(lp)) {
      doc.image(lp, 45, 20, { width: 130 });
      foundLogo = true;
      break;
    }
  }
  
  if (!foundLogo) {
    doc.fontSize(24).fillColor('#0056b3').font('Helvetica-Bold').text('STATCOM', 45, 25, { continued: true });
    doc.fontSize(24).fillColor('#888').font('Helvetica').text(' SERVICES');
  }

  // 2. TITRE ET NUMÉRO (Style Word/Excel)
  doc.fontSize(13).fillColor('#000').font('Helvetica-Bold').text('DECHARGE N° :', 350, 30, { continued: true });
  doc.font('Helvetica').text(` ${data.id || '..........'}`);

  // 3. CONTENU PRINCIPAL
  const startY = 115;
  doc.fontSize(11).font('Helvetica').fillColor('#000');
  
  doc.text('Je soussigné(e) Mr/Mme/Mlle :', 45, startY);
  doc.font('Helvetica-Bold').text(data.display_beneficiary || '...................................................................................................', 200, startY);
  
  doc.moveDown(2.2);
  doc.font('Helvetica').text('Reconnais avoir reçu une somme de :', 45, doc.y);
  const formattedAmount = Number(data.amount || 0).toLocaleString('fr-FR').replace(/[\s\u202f\u00a0]/g, ' ');
  const amountStr = `${formattedAmount} ${data.currency || 'XAF'}`;
  doc.font('Helvetica-Bold').text(amountStr, 245, doc.y - 11);
  
  doc.moveDown(2.2);
  doc.font('Helvetica').text('Motif :', 45, doc.y);
  doc.font('Helvetica-Bold').text(data.motif || '................................................................................................................', 90, doc.y - 11);

  // 4. DATE ET LIEU
  doc.moveDown(1.2);
  const dateStr = new Date(data.date || Date.now()).toLocaleDateString('fr-FR');
  doc.font('Helvetica-Bold').text(`Fait à Brazzaville, le ${dateStr}`, 45, doc.y, { align: 'right', width: 510 });

  // 5. BLOCS DE SIGNATURES (Rectangles Excel)
  const sigY = doc.y + 25;
  doc.fontSize(10).font('Helvetica-Bold');
  doc.text('Bénéficiaire', 45, sigY, { width: 160, align: 'center' });
  doc.text('Comptabilité', 220, sigY, { width: 160, align: 'center' });
  doc.text('Direction', 395, sigY, { width: 160, align: 'center' });

  doc.lineWidth(1).strokeColor('#000');
  doc.rect(45, sigY + 15, 160, 50).stroke(); // Box Bénéficiaire
  doc.rect(220, sigY + 15, 160, 50).stroke(); // Box Comptabilité
  doc.rect(395, sigY + 15, 160, 50).stroke(); // Box Direction

  doc.end();
};

const generateFicheTravauxPDF = (data, res) => {
  const doc = new PDFDocument({ margin: 45, size: 'A4', bufferPages: true });
  const filename = `fiche_travaux_${data.id || Date.now()}.pdf`;
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/pdf');
  doc.pipe(res);

  // 1. LOGO
  const logoPaths = [
    path.join(__dirname, '../../frontend/assets/img/logo.png.jpg'),
    path.join(__dirname, '../../frontend/assets/img/logo.png'),
    path.join(__dirname, '../../frontend/assets/img/logo.jpg'),
    path.join(__dirname, '../logo.png'),
    path.join(__dirname, '../logo.jpg')
  ];
  let foundLogo = false;
  for(let lp of logoPaths) {
    if (fs.existsSync(lp)) { doc.image(lp, 45, 10, { width: 175 }); foundLogo = true; break; }
  }
  if (!foundLogo) {
    doc.fontSize(22).fillColor('#0056b3').font('Helvetica-Bold').text('STATCOM', 45, 20, { continued: true });
    doc.fontSize(22).fillColor('#888').font('Helvetica').text(' SERVICES');
  }

  doc.moveDown(4);

  // 2. TITLE
  doc.fontSize(16).fillColor('#000').font('Helvetica-Bold');
  doc.text('FICHE DE FIN DES TRAVAUX', 45, 120, { align: 'center', underline: true });
  
  doc.moveDown(2);

  // 3. TABLE HEADER
  const startY = 160;
  let currentY = startY;
  
  doc.lineWidth(1).strokeColor('#000');
  
  // Draw header borders
  doc.rect(45, currentY, 400, 20).stroke();
  doc.rect(445, currentY, 110, 20).stroke();
  
  doc.fontSize(11).font('Helvetica-Bold');
  doc.text('Actions', 45, currentY + 5, { width: 400, align: 'center' });
  doc.text('Observation', 445, currentY + 5, { width: 110, align: 'center' });
  currentY += 20;

  // 4. TABLE ROWS
  doc.font('Helvetica').fontSize(11);
  const checklist = (typeof data.items === 'string' ? JSON.parse(data.items) : data.items) || [];

  if (checklist.length === 0) {
    // Si vide, on peut mettre une ligne vide ou un message
    doc.rect(45, currentY, 400, 25).stroke();
    doc.rect(445, currentY, 110, 25).stroke();
    doc.text('Aucune tâche spécifiée', 50, currentY + 7);
    currentY += 25;
  }

  checklist.forEach((item) => {
    const actionText = typeof item === 'string' ? item : (item.action || '');
    const obsText = typeof item === 'string' ? 'Ok' : (item.observation || 'Ok');

    if (currentY > 650) {
      doc.addPage();
      currentY = 45;
      doc.font('Helvetica-Bold');
      doc.rect(45, currentY, 400, 20).stroke();
      doc.rect(445, currentY, 110, 20).stroke();
      doc.text('Actions', 45, currentY + 5, { width: 400, align: 'center' });
      doc.text('Observation', 445, currentY + 5, { width: 110, align: 'center' });
      currentY += 20;
      doc.font('Helvetica');
    }

    doc.rect(45, currentY, 400, 25).stroke();
    doc.rect(445, currentY, 110, 25).stroke();
    
    doc.text(actionText, 50, currentY + 7, { width: 390, align: 'left' });
    doc.text(obsText, 445, currentY + 7, { width: 110, align: 'center' });
    
    currentY += 25;
  });

  // 5. DATE & LOCATION
  doc.moveDown(2);
  const dateStr = new Date(data.date || Date.now()).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const city = "Brazzaville";
  currentY += 20;
  doc.fontSize(11).font('Helvetica');
  doc.text(`${city}, ${dateStr}`, 300, currentY, { align: 'right', width: 255 });

  // 6. SIGNATURES
  currentY += 50;
  if (currentY > 620) { doc.addPage(); currentY = 50; }

  const clientDisplayName = (data.client_name || '').trim();
  doc.font('Helvetica-Bold').text(clientDisplayName, 60, currentY, { align: 'left' });
  doc.text('STATCOM Services', 350, currentY, { align: 'center', width: 205 });
  
  // Signature names
  doc.font('Helvetica-Bold');
  doc.text('Stèves ATIA NGOUA', 350, currentY + 80, { align: 'center', width: 205 });

  // 7. BOTTOM FOOTER
  const numPages = doc._pageBuffer ? doc._pageBuffer.length : 1;
  for(let i = 0; i < numPages; i++) {
    doc.switchToPage ? doc.switchToPage(i) : null;
    const footerBase = 750;
    doc.lineWidth(1.5).strokeColor('#000').moveTo(45, footerBase).lineTo(555, footerBase).stroke();
    const footY = footerBase + 10;
    doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#000');
    doc.text('Adresse 38, Rue Laguë plateau – Tél : 06 578 62 23 / 06 672 70 59', 45, footY, { align: 'center', width: 510 });
    doc.text('RCCM CG/BZV/17 A 22310 NIU: P201711000745213 UBA: 90101600722 BCH: 10120001652', 45, footY + 10, { align: 'center', width: 510 });
    doc.text('Régime d\'imposition : Forfaitaire- Résidence Fiscale : Ouenze', 45, footY + 20, { align: 'center', width: 510 });
  }

  doc.end();
};

module.exports = { generatePDF, generateDechargePDF, generateFicheTravauxPDF };