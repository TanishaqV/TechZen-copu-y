import pg from 'pg';

const connectionString = 'postgresql://postgres:Tm_Ee^MVJ9@vvyk@db.zkuewwwdlydsfpzrfeab.supabase.co:5432/postgres';

const pool = new pg.Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
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

    console.log('✅ Supabase Database tables created/verified successfully!');
  } catch (err) {
    console.error('❌ Database Initialization Error:', err);
    throw err;
  } finally {
    client.release();
  }
}

export default pool;
