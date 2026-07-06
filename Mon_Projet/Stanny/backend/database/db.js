const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'statcom_db',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

const init = async () => {
  try {
    // Tenter de se connecter à la base de données configurée
    const client = await pool.connect();
    console.log(`✅ Connecté à la base de données PostgreSQL : ${process.env.DB_NAME || 'statcom_db'}`);
    
    // Charger le schéma SQL
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      await client.query(schema);
      console.log('✅ Schéma de la base de données initialisé avec succès');
    }
    
    client.release();
  } catch (err) {
    if (err.code === '3D000') { // Code d'erreur pour "database does not exist"
      console.error(`❌ La base de données "${process.env.DB_NAME || 'statcom_db'}" n'existe pas.`);
      console.log('💡 Veuillez créer la base de données manuellement dans PostgreSQL :');
      console.log(`   CREATE DATABASE ${process.env.DB_NAME || 'statcom_db'};`);
    } else if (err.code === '28P01') {
      console.error('❌ Échec d\'authentification PostgreSQL. Vérifiez votre mot de passe dans le fichier .env.');
    } else {
      console.error('❌ Erreur de connexion PostgreSQL:', err.message);
    }
    throw err;
  }
};

module.exports = {
  query: (text, params) => pool.query(text, params),
  init,
  pool
};
