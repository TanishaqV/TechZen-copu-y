import express from 'express';
import cors from 'cors';
import pool, { initDatabase } from './db.js';
import { INITIAL_EVENTS } from '../src/mockData.js';

const app = express();
const PORT = process.env.PORT || 3001;

const ADMIN_EMAIL = 'tanishaqvermatechzen@gmail.com';

app.use(cors());
app.use(express.json());

// Seed default events if table is empty
async function seedInitialEvents() {
  const { rows } = await pool.query('SELECT COUNT(*) FROM events');
  if (parseInt(rows[0].count) === 0) {
    console.log('Seeding initial events into Supabase PostgreSQL...');
    for (const ev of INITIAL_EVENTS) {
      await pool.query(`
        INSERT INTO events (
          id, title, tagline, category, badge, date, time, location_type, location,
          capacity, rsvp_count, cover_image, host_name, host_avatar, host_role,
          description, tags, agenda, custom_questions
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        ON CONFLICT (id) DO NOTHING;
      `, [
        ev.id, ev.title, ev.tagline, ev.category, ev.badge, ev.date, ev.time, ev.locationType, ev.location,
        ev.capacity, ev.rsvpCount, ev.coverImage, ev.hostName, ev.hostAvatar, ev.hostRole,
        ev.description, ev.tags, JSON.stringify(ev.agenda), JSON.stringify(ev.customQuestions)
      ]);
    }
    console.log('✅ Initial events seeded into Supabase!');
  }
}

// Initialize database tables & seed
initDatabase().then(() => {
  seedInitialEvents();
}).catch(console.error);

function mapEventRow(row) {
  return {
    id: row.id,
    title: row.title,
    tagline: row.tagline,
    category: row.category,
    badge: row.badge,
    date: row.date,
    time: row.time,
    locationType: row.location_type,
    location: row.location,
    capacity: row.capacity,
    rsvpCount: row.rsvp_count,
    coverImage: row.cover_image,
    hostName: row.host_name,
    hostAvatar: row.host_avatar,
    hostRole: row.host_role,
    description: row.description,
    tags: row.tags || [],
    agenda: typeof row.agenda === 'string' ? JSON.parse(row.agenda) : row.agenda,
    customQuestions: typeof row.custom_questions === 'string' ? JSON.parse(row.custom_questions) : row.custom_questions
  };
}

function mapRegistrationRow(row) {
  return {
    id: row.id,
    eventId: row.event_id,
    userId: row.user_id,
    userName: row.user_name,
    userEmail: row.user_email,
    ticketCode: row.ticket_code,
    answers: typeof row.answers === 'string' ? JSON.parse(row.answers) : row.answers,
    checkedIn: row.checked_in,
    registeredAt: row.registered_at
  };
}

// GET /api/events
app.get('/api/events', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM events ORDER BY created_at DESC');
    res.json(rows.map(mapEventRow));
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// POST /api/events - ADMIN PROTECTED
app.post('/api/events', async (req, res) => {
  try {
    const ev = req.body;
    const userEmail = req.headers['x-user-email'] || ev.hostEmail || ADMIN_EMAIL;

    // Enforce Admin Email restriction
    if (userEmail.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return res.status(403).json({ error: `Forbidden: Events can only be posted by admin (${ADMIN_EMAIL})` });
    }

    const { rows } = await pool.query(`
      INSERT INTO events (
        id, title, tagline, category, badge, date, time, location_type, location,
        capacity, rsvp_count, cover_image, host_name, host_avatar, host_role,
        description, tags, agenda, custom_questions
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *;
    `, [
      ev.id, ev.title, ev.tagline, ev.category, ev.badge || ev.category, ev.date, ev.time, ev.locationType, ev.location,
      ev.capacity, 0, ev.coverImage, ev.hostName || 'TechZen Admin', ev.hostAvatar, 'Community Admin',
      ev.description, ev.tags, JSON.stringify(ev.agenda || []), JSON.stringify(ev.customQuestions || [])
    ]);

    res.status(201).json(mapEventRow(rows[0]));
  } catch (err) {
    console.error('Error creating event:', err);
    res.status(500).json({ error: 'Failed to create event in Supabase' });
  }
});

// DELETE /api/events/:id - ADMIN PROTECTED
app.delete('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM events WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting event:', err);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// POST /api/auth/signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const u = req.body;
    const isAdminUser = u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

    const { rows } = await pool.query(`
      INSERT INTO users (id, name, email, password, role, bio, avatar, tech_stack, github, linkedin)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
      RETURNING *;
    `, [
      u.id, u.name, u.email, u.password || 'hashed', isAdminUser ? 'Admin / Organizer' : (u.role || 'Attendee'),
      u.bio || '', u.avatar || '', u.techStack || [], u.github || '', u.linkedin || ''
    ]);

    const user = rows[0];
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      bio: user.bio,
      avatar: user.avatar,
      techStack: user.tech_stack,
      github: user.github,
      linkedin: user.linkedin
    });
  } catch (err) {
    console.error('Error signing up user:', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email } = req.body;
    const isAdminUser = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (rows.length === 0) {
      const newUser = {
        id: `usr-${Date.now()}`,
        name: isAdminUser ? 'Tanishaq Verma (Admin)' : email.split('@')[0].replace('.', ' ').replace(/^./, str => str.toUpperCase()),
        email: email,
        role: isAdminUser ? 'Admin / Organizer' : 'Attendee',
        bio: isAdminUser ? 'TechZen Community Founder & Admin' : 'TechZen Community Member',
        avatar: isAdminUser ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        techStack: ['Developer']
      };
      
      const insertResult = await pool.query(`
        INSERT INTO users (id, name, email, role, bio, avatar, tech_stack)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;
      `, [newUser.id, newUser.name, newUser.email, newUser.role, newUser.bio, newUser.avatar, newUser.techStack]);

      const u = insertResult.rows[0];
      return res.json({ id: u.id, name: u.name, email: u.email, role: u.role, bio: u.bio, avatar: u.avatar, techStack: u.tech_stack });
    }

    const u = rows[0];
    res.json({ id: u.id, name: u.name, email: u.email, role: isAdminUser ? 'Admin / Organizer' : u.role, bio: u.bio, avatar: u.avatar, techStack: u.tech_stack });
  } catch (err) {
    console.error('Error logging in user:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/registrations
app.get('/api/registrations', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM registrations ORDER BY registered_at DESC');
    res.json(rows.map(mapRegistrationRow));
  } catch (err) {
    console.error('Error fetching registrations:', err);
    res.status(500).json({ error: 'Failed to fetch registrations' });
  }
});

// POST /api/registrations
app.post('/api/registrations', async (req, res) => {
  try {
    const reg = req.body;
    const { rows } = await pool.query(`
      INSERT INTO registrations (id, event_id, user_id, user_name, user_email, ticket_code, answers)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `, [
      reg.id, reg.eventId, reg.userId, reg.userName, reg.userEmail, reg.ticketCode, JSON.stringify(reg.answers || {})
    ]);

    await pool.query('UPDATE events SET rsvp_count = rsvp_count + 1 WHERE id = $1', [reg.eventId]);

    res.status(201).json(mapRegistrationRow(rows[0]));
  } catch (err) {
    console.error('Error saving registration:', err);
    res.status(500).json({ error: 'Failed to register for event' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Supabase Database API Server running on port ${PORT}`);
});
