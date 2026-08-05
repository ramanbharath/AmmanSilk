const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: 'localhost', port: 5432,
  database: 'ammansilks_db',
  user: 'postgres', password: 'postgres'
});

async function fix() {
  const adminHash = await bcrypt.hash('admin123', 10);
  const staffHash = await bcrypt.hash('staff123', 10);

  await pool.query('UPDATE users SET password_hash=$1 WHERE username=$2', [adminHash, 'admin']);
  await pool.query('UPDATE users SET password_hash=$1 WHERE username=$2', [staffHash, 'staff']);

  // verify
  const result = await pool.query('SELECT username, password_hash FROM users');
  for (const row of result.rows) {
    const pwd = row.username === 'admin' ? 'admin123' : 'staff123';
    const ok = await bcrypt.compare(pwd, row.password_hash);
    console.log(`${row.username}: hash updated, verify=${ok}`);
  }
  await pool.end();
}

fix().catch(e => { console.error(e.message); pool.end(); });
