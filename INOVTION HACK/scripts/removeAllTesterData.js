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

async function purgeAllTesterData() {
  const client = await pool.connect();
  try {
    console.log("🧹 Purging ALL tester and sample data from Supabase PostgreSQL...");

    // 1. Truncate sample rows from tasks, projects, activities
    await client.query("TRUNCATE tasks, projects, activities CASCADE;");
    console.log("✅ Cleared 'tasks', 'projects', and 'activities' tables.");

    // 2. Reset metrics table to 0s
    await client.query(`
      INSERT INTO metrics (id, tasks_completed_value, tasks_completed_total, tasks_completed_percent, active_projects_count, hours_coded, sprint_velocity)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO UPDATE SET 
        tasks_completed_value = 0,
        tasks_completed_total = 0,
        tasks_completed_percent = 0,
        active_projects_count = 0,
        hours_coded = 0.0,
        sprint_velocity = 0;
    `, ["m-1", 0, 0, 0, 0, 0.0, 0]);
    console.log("✅ Reset 'metrics' table to 0s.");

    // 3. Reset user_profile table to clean default
    await client.query(`
      INSERT INTO user_profile (id, name, role, email, avatar, github, status, streak_days, commits_today, rank)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (id) DO UPDATE SET
        name = 'Developer',
        role = 'Full Stack Engineer',
        email = 'developer@innovationhacks.dev',
        avatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
        github = '@developer',
        status = 'Active',
        streak_days = 0,
        commits_today = 0,
        rank = 'Developer';
    `, [
      "user-1",
      "Developer",
      "Full Stack Engineer",
      "developer@innovationhacks.dev",
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256",
      "@developer",
      "Active",
      0,
      0,
      "Developer"
    ]);
    console.log("✅ Reset 'user_profile' table to clean defaults.");

    console.log("🎉 All tester data successfully purged from Supabase PostgreSQL!");
  } catch (err) {
    console.error("❌ Error purging tester data:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

purgeAllTesterData();
