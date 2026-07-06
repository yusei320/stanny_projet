const { Pool } = require('pg');
const passwords = ['postgre', 'postgres', 'admin', 'root', '1234', 'password', ''];

async function checkConnection() {
    console.log("--- Diagnostic de connexion PostgreSQL ---");
    for (let pw of passwords) {
        const pool = new Pool({
            user: 'postgres',
            host: 'localhost',
            database: 'statcom_db',
            password: pw,
            port: 5432,
        });
        try {
            await pool.query('SELECT NOW()');
            console.log(`\n✅ SUCCÈS : Le mot de passe correct est "${pw}"`);
            console.log(`Mettez à jour votre fichier .env avec : DB_PASSWORD=${pw}`);
            process.exit(0);
        } catch (e) {
            if (e.message.includes('n\'existe pas')) {
                console.log(`\n⚠️  ALERTE : La base de données "statcom_db" n'existe pas !`);
                console.log(`Le mot de passe "${pw}" semble correct, mais la base doit être créée.`);
                process.exit(1);
            }
            console.log(`❌ ÉCHEC : "${pw}" (${e.message})`);
        } finally {
            await pool.end();
        }
    }
    console.log("\n❌ Aucun mot de passe courant ne fonctionne. Merci de me donner celui que vous avez choisi à l'installation de PostgreSQL.");
}
checkConnection();
