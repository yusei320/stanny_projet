const db = require('./db');

async function updateSchema() {
  try {
    console.log('Début de la mise à jour du schéma utilisateur...');
    
    await db.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS pseudo VARCHAR(100),
      ADD COLUMN IF NOT EXISTS bio VARCHAR(160),
      ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
      ADD COLUMN IF NOT EXISTS location VARCHAR(255),
      ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'fr',
      ADD COLUMN IF NOT EXISTS dark_mode BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS newsletter BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;
    `);

    // S'assurer que profile_image est en TEXT pour le Base64
    await db.query('ALTER TABLE users ALTER COLUMN profile_image TYPE TEXT;');

    console.log('Schéma mis à jour avec succès !');
  } catch (e) {
    console.error('Erreur lors de la mise à jour du schéma :', e);
  } finally {
    process.exit();
  }
}

updateSchema();
