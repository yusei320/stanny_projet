const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'statcom_db',
    password: 'postgre',
    port: 5432,
});

async function run() {
    try {
        console.log("Adding column...");
        await pool.query('ALTER TABLE documents ADD COLUMN IF NOT EXISTS total_in_words VARCHAR(255)');
        console.log("Success");
    } catch(e) {
        console.log(e);
    } finally {
        process.exit();
    }
}
run();
