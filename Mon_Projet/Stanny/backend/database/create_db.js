const { Client } = require('pg');
require('dotenv').config();

const createDb = async () => {
  const client = new Client({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    password: process.env.DB_PASSWORD || 'postgre',
    port: process.env.DB_PORT || 5432,
    database: 'postgres', // Connect to default database
  });

  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL (base postgres)');
    
    const dbName = process.env.DB_NAME || 'statcom_db';
    
    // Vérifier si la base existe
    const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = '${dbName}'`);
    
    if (res.rowCount === 0) {
      console.log(`🔨 Création de la base de données "${dbName}"...`);
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Base de données "${dbName}" créée avec succès !`);
    } else {
      console.log(`ℹ️ La base de données "${dbName}" existe déjà.`);
    }
    
  } catch (err) {
    console.error('❌ Erreur lors de la création de la base de données:', err.message);
  } finally {
    await client.end();
  }
};

createDb();
