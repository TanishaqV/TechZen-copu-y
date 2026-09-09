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

async function resetStreak() {
  const client = await pool.connect();
  try {
    await client.query("UPDATE user_profile SET streak_days = 0, commits_today = 0;");
    console.log("✅ Reset user streak_days to 0 in Supabase PostgreSQL.");
  } catch (err) {
    console.error("Error resetting streak:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

resetStreak();
