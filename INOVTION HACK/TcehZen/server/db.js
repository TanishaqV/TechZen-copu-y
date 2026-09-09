import pg from 'pg';

// Connection details come from the environment only. A hardcoded fallback was
// previously committed here, which published a live database password.
const connectionString = process.env.DATABASE_URL || '';

export const isDbConfigured = () => Boolean(connectionString);

// Supabase (and most hosted Postgres) require TLS. Local development against a
// plain postgres:// instance does not, so only enable it when it is not local.
const isLocal = /(^|@)(localhost|127\.0\.0\.1)/.test(connectionString);

const pool = connectionString
  ? new pg.Pool({
      connectionString,
      ssl: isLocal ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    })
  : null;

if (pool) {
  // Guard against unhandled idle connection errors & network timeouts
  pool.on('error', (err) => {
    console.warn('PostgreSQL idle client reset:', err.message || err);
  });
} else {
  console.warn('DATABASE_URL is not set - the API will report 501 and the client will use its local demo data.');
}

export async function initDatabase() {
  if (!pool) throw new Error('DATABASE_URL is not set');
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password TEXT,
        role VARCHAR(255),
        bio TEXT,
        avatar TEXT,
        tech_stack JSONB DEFAULT '[]'::jsonb,
        github TEXT,
        linkedin TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS events (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        tagline TEXT,
        category VARCHAR(255),
        badge VARCHAR(255),
        date VARCHAR(255),
        time VARCHAR(255),
        location_type VARCHAR(255),
        location TEXT,
        capacity INTEGER DEFAULT 100,
        max_team_size INTEGER DEFAULT 4,
        max_teams INTEGER DEFAULT 50,
        allow_solo BOOLEAN DEFAULT TRUE,
        rsvp_count INTEGER DEFAULT 0,
        cover_image TEXT,
        banner_image TEXT,
        sponsor_logo TEXT,
        host_name VARCHAR(255),
        host_avatar TEXT,
        host_role VARCHAR(255),
        description TEXT,
        deadline_date VARCHAR(255),
        prize_pool TEXT,
        rules TEXT,
        tracks JSONB DEFAULT '[]'::jsonb,
        tags JSONB DEFAULT '[]'::jsonb,
        agenda JSONB DEFAULT '[]'::jsonb,
        custom_questions JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS registrations (
        id VARCHAR(255) PRIMARY KEY,
        event_id VARCHAR(255) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        user_id VARCHAR(255),
        user_name VARCHAR(255),
        user_email VARCHAR(255),
        ticket_code VARCHAR(255),
        answers JSONB DEFAULT '{}'::jsonb,
        checked_in BOOLEAN DEFAULT FALSE,
        registered_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (event_id, user_email)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id VARCHAR(255) PRIMARY KEY,
        event_id VARCHAR(255) REFERENCES events(id) ON DELETE CASCADE,
        invite_code VARCHAR(255) UNIQUE NOT NULL,
        team_name VARCHAR(500) NOT NULL,
        leader_name VARCHAR(255) NOT NULL,
        leader_email VARCHAR(255) NOT NULL,
        participant_count INTEGER DEFAULT 1,
        teammates JSONB NOT NULL DEFAULT '[]'::jsonb,
        project JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(255) PRIMARY KEY,
        action VARCHAR(500),
        details TEXT,
        target_user VARCHAR(255),
        edited_by VARCHAR(255),
        timestamp TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Indexes for the lookups the API actually performs.
    await client.query('CREATE INDEX IF NOT EXISTS idx_reg_event ON registrations(event_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_reg_email ON registrations(LOWER(user_email));');
    await client.query('CREATE INDEX IF NOT EXISTS idx_teams_event ON teams(event_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_teams_leader ON teams(LOWER(leader_email));');

    console.log('Database schema ready.');
  } finally {
    client.release();
  }
}

export default pool;
