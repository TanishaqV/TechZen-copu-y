import 'dotenv/config';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

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

async function setupAuthTable() {
  const client = await pool.connect();
  try {
    console.log("⚡ Updating 'users' table in Supabase PostgreSQL...");

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(150) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        role VARCHAR(100) DEFAULT 'Senior Full Stack Engineer',
        avatar TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT;
    `);

    console.log("✅ Table 'users' created/verified with columns.");

    // Seed default demo user if not exists
    const defaultEmail = "alex.rivera@innovationhacks.dev";
    const defaultPass = "Password123!";
    const hashedPassword = await bcrypt.hash(defaultPass, 10);
    const userId = crypto.randomUUID();

    const existing = await client.query('SELECT * FROM users WHERE email = $1;', [defaultEmail]);
    if (existing.rows.length === 0) {
      await client.query(`
        INSERT INTO users (id, email, password_hash, name, role, avatar)
        VALUES ($1, $2, $3, $4, $5, $6);
      `, [
        userId,
        defaultEmail,
        hashedPassword,
        "Alex Rivera",
        "Senior Full Stack Engineer",
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256"
      ]);
      console.log(`👤 Seeded demo user: ${defaultEmail} / ${defaultPass}`);
    } else {
      console.log(`👤 Demo user already exists: ${defaultEmail}`);
    }

    console.log("🎉 Auth schema migration completed successfully in Supabase PostgreSQL!");
  } catch (err) {
    console.error("❌ Auth setup error:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

setupAuthTable();
