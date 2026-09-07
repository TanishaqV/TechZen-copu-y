import pg from 'pg';

const connectionString = 'postgresql://postgres:Tm_Ee^MVJ9@vvyk@db.zkuewwwdlydsfpzrfeab.supabase.co:5432/postgres';

const pool = new pg.Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

// Guard against unhandled idle connection errors & network timeouts
pool.on('error', (err) => {
  console.warn('⚡ Supabase PostgreSQL idle client reconnected/reset:', err.message || err);
});

export async function initDatabase() {
  const client = await pool.connect();
  try {
    console.log('Connecting to Supabase PostgreSQL database...');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255),
        role VARCHAR(50) DEFAULT 'Attendee',
        bio TEXT,
        avatar TEXT,
        tech_stack TEXT[],
        github VARCHAR(255),
        linkedin VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Events table
    await client.query(`
      CREATE TABLE IF NOT EXISTS events (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        tagline TEXT,
        category VARCHAR(100),
        badge VARCHAR(100),
        date VARCHAR(100),
        time VARCHAR(100),
        location_type VARCHAR(50),
        location TEXT,
        capacity INTEGER DEFAULT 100,
        max_team_size INTEGER DEFAULT 4,
        allow_solo BOOLEAN DEFAULT TRUE,
        max_teams INTEGER DEFAULT 50,
        rsvp_count INTEGER DEFAULT 0,
        cover_image TEXT,
        host_name VARCHAR(255),
        host_avatar TEXT,
        host_role VARCHAR(255),
        description TEXT,
        tags TEXT[],
        agenda JSONB,
        custom_questions JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure columns exist on existing database
    await client.query(`
      ALTER TABLE events ADD COLUMN IF NOT EXISTS allow_solo BOOLEAN DEFAULT TRUE;
      ALTER TABLE events ADD COLUMN IF NOT EXISTS max_team_size INTEGER DEFAULT 4;
      ALTER TABLE events ADD COLUMN IF NOT EXISTS max_teams INTEGER DEFAULT 50;
    `);

    // Registrations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS registrations (
        id VARCHAR(255) PRIMARY KEY,
        event_id VARCHAR(255) REFERENCES events(id) ON DELETE CASCADE,
        user_id VARCHAR(255),
        user_name VARCHAR(255),
        user_email VARCHAR(255),
        ticket_code VARCHAR(100) UNIQUE NOT NULL,
        answers JSONB,
        checked_in BOOLEAN DEFAULT FALSE,
        registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Teams table for live multi-user team onboarding & invite links
    await client.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id VARCHAR(255) PRIMARY KEY,
        event_id VARCHAR(255) REFERENCES events(id) ON DELETE CASCADE,
        invite_code VARCHAR(255) UNIQUE NOT NULL,
        team_name VARCHAR(255) NOT NULL,
        leader_name VARCHAR(255) NOT NULL,
        leader_email VARCHAR(255) NOT NULL,
        participant_count INTEGER DEFAULT 1,
        teammates JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Audit logs table for tracking registration & team edits made by admins
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(255) PRIMARY KEY,
        action VARCHAR(255) NOT NULL,
        details TEXT NOT NULL,
        target_user VARCHAR(255),
        edited_by VARCHAR(255) NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Supabase Database tables created/verified successfully!');
  } catch (err) {
    console.error('❌ Database Initialization Error:', err);
    throw err;
  } finally {
    client.release();
  }
}

export default pool;
