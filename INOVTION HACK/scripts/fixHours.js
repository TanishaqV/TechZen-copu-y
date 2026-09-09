import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

// Connection string comes from the environment. A hardcoded Supabase password
// was previously committed here and published with the public repository.
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not set. Copy .env.example to .env and fill it in.');
  process.exit(1);
}
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function fixHours() {
  const client = await pool.connect();
  try {
    await client.query("UPDATE metrics SET hours_coded = 0.0;");
    console.log("✅ Updated hours_coded to 0.0 in Supabase PostgreSQL.");
  } catch (err) {
    console.error("Error fixing hours:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

fixHours();
