import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

// Connection string comes from the environment. A hardcoded Supabase password
// was previously committed here and published with the repository.
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not set. Copy .env.example to .env and fill it in.');
  process.exit(1);
}
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function clearTesterData() {
  const client = await pool.connect();
  try {
    console.log("🧹 Clearing all tester/sample data from Supabase PostgreSQL database...");

    // Truncate tester rows from tables
    await client.query("TRUNCATE tasks, projects, activities, metrics CASCADE;");
    
    // Insert initial clean default metrics (all 0s)
    await client.query(`
      INSERT INTO metrics (id, tasks_completed_value, tasks_completed_total, tasks_completed_percent, active_projects_count, hours_coded, sprint_velocity)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO UPDATE SET 
        tasks_completed_value = 0,
        tasks_completed_total = 0,
        tasks_completed_percent = 0,
        active_projects_count = 0,
        hours_coded = 0,
        sprint_velocity = 0;
    `, ["m-1", 0, 0, 0, 0, 0.0, 0]);

    console.log("✅ Tester data cleared! Tables 'tasks', 'projects', 'activities' are now completely empty.");
  } catch (err) {
    console.error("❌ Error clearing tester data:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

clearTesterData();
