const db = require('./db');
async function alter() {
  try {
    await db.query('ALTER TABLE users ALTER COLUMN profile_image TYPE TEXT;');
    console.log('OK');
  } catch (e) {
    console.error(e);
  } finally {
    process.exit();
  }
}
alter();
