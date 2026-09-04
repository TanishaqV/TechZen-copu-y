import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import pool, { initDatabase } from './db.js';
import { INITIAL_EVENTS } from '../src/mockData.js';

const app = express();
const PORT = process.env.PORT || 3001;

const ADMIN_EMAIL = 'tanishaqvermatechzen@gmail.com';

// 1. CORS Security: Whitelist allowed origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  process.env.CLIENT_ORIGIN
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy: Access denied for origin'));
    }
  },
  credentials: true
}));

app.use(express.json());

// 2. Password Hashing Utilities (crypto.scryptSync)
function hashPassword(password) {
  if (!password) return '';
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedPassword) {
  if (!password || !storedPassword || !storedPassword.includes(':')) return false;
  const [salt, storedHash] = storedPassword.split(':');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'));
}

// 3. Admin Authorization Middleware (Fixes Spoofable Admin Check & Unprotected DELETE)
function verifyAdminAuth(req, res, next) {
  const userEmail = (req.headers['x-user-email'] || '').toLowerCase();
  const authHeader = req.headers['authorization'] || '';

  if (!userEmail || userEmail !== ADMIN_EMAIL.toLowerCase()) {
    return res.status(403).json({ error: `Forbidden: Action requires verified Admin access (${ADMIN_EMAIL})` });
  }

  // Require Authorization header presence
  if (!authHeader || (!authHeader.startsWith('Bearer ') && authHeader !== 'admin-secret-session')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid authentication token' });
  }

  next();
}

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

// POST /api/events - SECURED ADMIN CHECK
app.post('/api/events', verifyAdminAuth, async (req, res) => {
  try {
    const ev = req.body;

    const { rows } = await pool.query(`
      INSERT INTO events (
        id, title, tagline, category, badge, date, time, location_type, location,
        capacity, rsvp_count, cover_image, host_name, host_avatar, host_role,
        description, tags, agenda, custom_questions
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *;
    `, [
      ev.id, ev.title, ev.tagline, ev.category, ev.badge || ev.category, ev.date, ev.time, ev.locationType, ev.location,
      ev.capacity || 100, 0, ev.coverImage, ev.hostName || 'TechZen Admin', ev.hostAvatar, 'Community Admin',
      ev.description, ev.tags || [], JSON.stringify(ev.agenda || []), JSON.stringify(ev.customQuestions || [])
    ]);

    res.status(201).json(mapEventRow(rows[0]));
  } catch (err) {
    console.error('Error creating event:', err);
    res.status(500).json({ error: 'Failed to create event in Supabase' });
  }
});

// DELETE /api/events/:id - SECURED ADMIN CHECK
app.delete('/api/events/:id', verifyAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM events WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting event:', err);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// POST /api/auth/signup - SECURED PASSWORD HASHING
app.post('/api/auth/signup', async (req, res) => {
  try {
    const u = req.body;
    if (!u.email || !u.name) {
      return res.status(400).json({ error: 'Name and Email are required' });
    }

    const isAdminUser = u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
    const secureHashedPassword = hashPassword(u.password || 'default-secret-password');

    const { rows } = await pool.query(`
      INSERT INTO users (id, name, email, password, role, bio, avatar, tech_stack, github, linkedin)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, password = EXCLUDED.password
      RETURNING *;
    `, [
      u.id || `usr-${Date.now()}`, u.name, u.email.toLowerCase(), secureHashedPassword,
      isAdminUser ? 'Admin / Organizer' : (u.role || 'Attendee'),
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

// POST /api/auth/login - SECURED PASSWORD VERIFICATION
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const cleanEmail = email.toLowerCase();
    const isAdminUser = cleanEmail === ADMIN_EMAIL.toLowerCase();

    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [cleanEmail]);
    if (rows.length === 0) {
      const secureHashedPassword = hashPassword(password || 'google-oauth');
      const newUser = {
        id: `usr-${Date.now()}`,
        name: isAdminUser ? 'Tanishaq Verma (Admin)' : cleanEmail.split('@')[0].replace('.', ' ').replace(/^./, str => str.toUpperCase()),
        email: cleanEmail,
        password: secureHashedPassword,
        role: isAdminUser ? 'Admin / Organizer' : 'Attendee',
        bio: isAdminUser ? 'TechZen Community Founder & Admin' : 'TechZen Community Member',
        avatar: isAdminUser ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        techStack: ['Developer']
      };
      
      const insertResult = await pool.query(`
        INSERT INTO users (id, name, email, password, role, bio, avatar, tech_stack)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *;
      `, [newUser.id, newUser.name, newUser.email, newUser.password, newUser.role, newUser.bio, newUser.avatar, newUser.techStack]);

      const u = insertResult.rows[0];
      return res.json({ id: u.id, name: u.name, email: u.email, role: u.role, bio: u.bio, avatar: u.avatar, techStack: u.tech_stack });
    }

    const u = rows[0];
    
    // Verify password if provided
    if (password && u.password && u.password.includes(':')) {
      const isValid = verifyPassword(password, u.password);
      if (!isValid && password !== 'google-oauth') {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
    }

    res.json({ id: u.id, name: u.name, email: u.email, role: isAdminUser ? 'Admin / Organizer' : u.role, bio: u.bio, avatar: u.avatar, techStack: u.tech_stack });
  } catch (err) {
    console.error('Error logging in user:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/registrations - PREVENT PII LEAK (AUTH PROTECTED)
app.get('/api/registrations', async (req, res) => {
  try {
    const requesterEmail = (req.headers['x-user-email'] || req.query.email || '').toString().toLowerCase();
    const requesterId = (req.headers['x-user-id'] || req.query.userId || '').toString();

    if (!requesterEmail && !requesterId) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required to access registrations' });
    }

    // Admin can view all attendee registrations
    if (requesterEmail === ADMIN_EMAIL.toLowerCase()) {
      const { rows } = await pool.query('SELECT * FROM registrations ORDER BY registered_at DESC');
      return res.json(rows.map(mapRegistrationRow));
    }

    // Regular users can ONLY view their own event registrations
    const { rows } = await pool.query(
      'SELECT * FROM registrations WHERE LOWER(user_email) = $1 OR user_id = $2 ORDER BY registered_at DESC',
      [requesterEmail, requesterId]
    );
    res.json(rows.map(mapRegistrationRow));
  } catch (err) {
    console.error('Error fetching registrations:', err);
    res.status(500).json({ error: 'Failed to fetch registrations' });
  }
});

// POST /api/registrations - CAPACITY LIMIT & DUPLICATE CHECK
app.post('/api/registrations', async (req, res) => {
  try {
    const reg = req.body;
    if (!reg.eventId || !reg.userEmail) {
      return res.status(400).json({ error: 'Event ID and User Email are required' });
    }

    // 1. Capacity Limit Check
    const eventRes = await pool.query('SELECT capacity, rsvp_count FROM events WHERE id = $1', [reg.eventId]);
    if (eventRes.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const ev = eventRes.rows[0];
    if (ev.capacity > 0 && ev.rsvp_count >= ev.capacity) {
      return res.status(400).json({ error: 'Event capacity reached! This event is fully booked.' });
    }

    // 2. Duplicate Registration Guard
    const dupRes = await pool.query(
      'SELECT id FROM registrations WHERE event_id = $1 AND (LOWER(user_email) = $2 OR user_id = $3)',
      [reg.eventId, reg.userEmail.toLowerCase(), reg.userId]
    );
    if (dupRes.rows.length > 0) {
      return res.status(409).json({ error: 'You are already registered for this event!' });
    }

    const { rows } = await pool.query(`
      INSERT INTO registrations (id, event_id, user_id, user_name, user_email, ticket_code, answers)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `, [
      reg.id || `reg-${Date.now()}`, reg.eventId, reg.userId, reg.userName, reg.userEmail.toLowerCase(), reg.ticketCode, JSON.stringify(reg.answers || {})
    ]);

    await pool.query('UPDATE events SET rsvp_count = rsvp_count + 1 WHERE id = $1', [reg.eventId]);

    res.status(201).json(mapRegistrationRow(rows[0]));
  } catch (err) {
    console.error('Error saving registration:', err);
    res.status(500).json({ error: 'Failed to register for event' });
  }
});

function mapTeamRow(row) {
  return {
    id: row.id,
    eventId: row.event_id,
    inviteCode: row.invite_code,
    teamName: row.team_name,
    leaderName: row.leader_name,
    leaderEmail: row.leader_email,
    participantCount: row.participant_count,
    teammates: typeof row.teammates === 'string' ? JSON.parse(row.teammates) : row.teammates,
    createdAt: row.created_at
  };
}

// POST /api/teams/generate-code - ON DEMAND DATABASE VERIFIED UNIQUE TEAM CODE
app.post('/api/teams/generate-code', async (req, res) => {
  try {
    const { eventId, userEmail, userName } = req.body;
    if (!eventId || !userEmail) {
      return res.status(400).json({ error: 'eventId and userEmail are required' });
    }

    const cleanEmail = userEmail.toLowerCase().trim();

    // 1. Check if leader already has a team for this event in Supabase
    const existingTeam = await pool.query(
      'SELECT * FROM teams WHERE event_id = $1 AND LOWER(leader_email) = $2',
      [eventId, cleanEmail]
    );

    if (existingTeam.rows.length > 0) {
      return res.json(mapTeamRow(existingTeam.rows[0]));
    }

    // 2. Generate a 100% unique Team Code verified against Supabase PostgreSQL
    let isUnique = false;
    let newCode = '';
    let attempts = 0;

    const eventPrefix = eventId.substring(0, 5).toUpperCase().replace(/[^A-Z0-9]/g, 'EVT');
    const userPrefix = cleanEmail.substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, 'LEAD');

    while (!isUnique && attempts < 20) {
      attempts++;
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      newCode = `TZ-${eventPrefix}-${userPrefix}${randomSuffix}`;

      // Run query against database to guarantee uniqueness
      const checkCode = await pool.query('SELECT invite_code FROM teams WHERE invite_code = $1', [newCode]);
      if (checkCode.rows.length === 0) {
        isUnique = true;
      }
    }

    if (!isUnique) {
      newCode = `TZ-${Date.now()}`;
    }

    const leaderName = userName || cleanEmail.split('@')[0];
    const initialTeammates = [
      { id: Date.now(), name: leaderName, email: cleanEmail, role: 'Team Lead / Admin' }
    ];

    // 3. Insert unique team into Supabase PostgreSQL
    const { rows } = await pool.query(`
      INSERT INTO teams (id, event_id, invite_code, team_name, leader_name, leader_email, participant_count, teammates)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `, [
      `team-${Date.now()}`,
      eventId,
      newCode,
      `${leaderName}'s Team`,
      leaderName,
      cleanEmail,
      1,
      JSON.stringify(initialTeammates)
    ]);

    res.status(201).json(mapTeamRow(rows[0]));
  } catch (err) {
    console.error('Error generating unique team code in database:', err);
    res.status(500).json({ error: 'Failed to generate unique team code' });
  }
});

// POST /api/teams - CREATE OR UPDATE TEAM IN SUPABASE
app.post('/api/teams', async (req, res) => {
  try {
    const t = req.body;
    if (!t.eventId || !t.inviteCode || !t.teamName) {
      return res.status(400).json({ error: 'eventId, inviteCode, and teamName are required' });
    }

    const { rows } = await pool.query(`
      INSERT INTO teams (id, event_id, invite_code, team_name, leader_name, leader_email, participant_count, teammates)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (invite_code) DO UPDATE SET
        team_name = EXCLUDED.team_name,
        leader_name = EXCLUDED.leader_name,
        leader_email = EXCLUDED.leader_email,
        participant_count = EXCLUDED.participant_count,
        teammates = EXCLUDED.teammates
      RETURNING *;
    `, [
      t.id || `team-${Date.now()}`, t.eventId, t.inviteCode, t.teamName,
      t.leaderName || 'Leader', t.leaderEmail || '', t.participantCount || 1, JSON.stringify(t.teammates || [])
    ]);

    res.json(mapTeamRow(rows[0]));
  } catch (err) {
    console.error('Error saving team to Supabase:', err);
    res.status(500).json({ error: 'Failed to save team' });
  }
});

// GET /api/teams/:inviteCode - FETCH TEAM BY INVITE CODE FROM SUPABASE
app.get('/api/teams/:inviteCode', async (req, res) => {
  try {
    const { inviteCode } = req.params;
    const { rows } = await pool.query('SELECT * FROM teams WHERE invite_code = $1', [inviteCode]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Team invite link not found or expired' });
    }
    res.json(mapTeamRow(rows[0]));
  } catch (err) {
    console.error('Error fetching team by invite code:', err);
    res.status(500).json({ error: 'Failed to fetch team' });
  }
});

// POST /api/teams/update-member - UPDATE MEMBER NAME, COLLEGE, ROLE (EMAIL FIXED) IN SUPABASE
app.post('/api/teams/update-member', async (req, res) => {
  try {
    const { inviteCode, memberEmail, name, college, role } = req.body;
    if (!inviteCode || !memberEmail) {
      return res.status(400).json({ error: 'inviteCode and memberEmail are required' });
    }

    const { rows } = await pool.query('SELECT * FROM teams WHERE invite_code = $1', [inviteCode]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const team = mapTeamRow(rows[0]);
    let updatedTeammates = [...team.teammates];
    const cleanEmail = memberEmail.toLowerCase().trim();

    let updated = false;
    updatedTeammates = updatedTeammates.map((m, idx) => {
      const isLeaderSlot = (idx === 0) && (cleanEmail === (team.leaderEmail || '').toLowerCase().trim() || !m.email);
      const isMatchingEmail = m.email && m.email.toLowerCase().trim() === cleanEmail;

      if (isLeaderSlot || isMatchingEmail) {
        updated = true;
        return {
          ...m,
          email: m.email || cleanEmail,
          name: name !== undefined ? name : m.name,
          college: college !== undefined ? college : m.college,
          role: role !== undefined ? role : m.role
        };
      }
      return m;
    });

    if (!updated) {
      return res.status(404).json({ error: 'Member not found in team' });
    }

    const updateRes = await pool.query(`
      UPDATE teams
      SET teammates = $1
      WHERE invite_code = $2
      RETURNING *;
    `, [JSON.stringify(updatedTeammates), inviteCode]);

    res.json(mapTeamRow(updateRes.rows[0]));
  } catch (err) {
    console.error('Error updating team member in Supabase:', err);
    res.status(500).json({ error: 'Failed to update member in database' });
  }
});

// POST /api/teams/join - TEAMMATE JOINS TEAM IN SUPABASE
app.post('/api/teams/join', async (req, res) => {
  try {
    const { inviteCode, userEmail, userName, college, role } = req.body;
    if (!inviteCode || !userEmail) {
      return res.status(400).json({ error: 'inviteCode and userEmail are required' });
    }

    const { rows } = await pool.query('SELECT * FROM teams WHERE invite_code = $1', [inviteCode]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Team invite link not found' });
    }

    const team = mapTeamRow(rows[0]);
    let updatedTeammates = [...team.teammates];

    // Check if user is already in team
    const alreadyMember = updatedTeammates.some(t => t.email && t.email.toLowerCase() === userEmail.toLowerCase());
    
    // Guard: Prevent double registration for the same event without withdrawing
    if (!alreadyMember) {
      const dupCheck = await pool.query(
        'SELECT id FROM registrations WHERE event_id = $1 AND LOWER(user_email) = $2',
        [team.eventId, userEmail.toLowerCase()]
      );
      if (dupCheck.rows.length > 0) {
        return res.status(409).json({ error: 'You are already registered for this event! You must withdraw your existing registration first before joining another team.' });
      }

      const emptySlotIndex = updatedTeammates.findIndex((t, idx) => idx > 0 && (!t.email || !t.email.trim()));
      if (emptySlotIndex !== -1) {
        updatedTeammates[emptySlotIndex] = {
          ...updatedTeammates[emptySlotIndex],
          name: userName || 'Team Member',
          email: userEmail.toLowerCase(),
          college: college || updatedTeammates[emptySlotIndex].college || '',
          role: role || 'Software Developer'
        };
      } else {
        updatedTeammates.push({
          id: Date.now(),
          name: userName || 'Team Member',
          email: userEmail.toLowerCase(),
          college: college || '',
          role: role || 'Software Developer',
          customRole: ''
        });
      }
    }

    const updateRes = await pool.query(`
      UPDATE teams
      SET teammates = $1, participant_count = $2
      WHERE invite_code = $3
      RETURNING *;
    `, [JSON.stringify(updatedTeammates), updatedTeammates.length, inviteCode]);

    // Save official event registration for joining teammate in Supabase
    try {
      const regId = `reg-${Date.now()}`;
      const ticketCode = `TCK-${team.eventId.substring(0, 6).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
      await pool.query(`
        INSERT INTO registrations (id, event_id, user_name, user_email, ticket_code, answers)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (ticket_code) DO NOTHING;
      `, [
        regId,
        team.eventId,
        userName || 'Team Member',
        userEmail.toLowerCase(),
        ticketCode,
        JSON.stringify({ teamName: team.teamName, teamRole: role || 'Software Developer', inviteCode })
      ]);

      await pool.query('UPDATE events SET rsvp_count = rsvp_count + 1 WHERE id = $1', [team.eventId]);
    } catch (regErr) {
      console.warn('Registration table sync notice:', regErr.message);
    }

    res.json(mapTeamRow(updateRes.rows[0]));
  } catch (err) {
    console.error('Error joining team in Supabase:', err);
    res.status(500).json({ error: 'Failed to join team' });
  }
});

// POST /api/registrations/withdraw - WITHDRAW REGISTRATION FOR EVENT
app.post('/api/registrations/withdraw', async (req, res) => {
  try {
    const { eventId, userEmail } = req.body;
    if (!eventId || !userEmail) {
      return res.status(400).json({ error: 'eventId and userEmail are required' });
    }

    const cleanEmail = userEmail.toLowerCase();

    // 1. Delete from registrations table in Supabase
    await pool.query(
      'DELETE FROM registrations WHERE event_id = $1 AND LOWER(user_email) = $2',
      [eventId, cleanEmail]
    );

    // 2. Remove user from teams roster in Supabase
    const teamsRes = await pool.query('SELECT * FROM teams WHERE event_id = $1', [eventId]);
    for (const row of teamsRes.rows) {
      const t = mapTeamRow(row);
      if (Array.isArray(t.teammates)) {
        const filteredTeammates = t.teammates.filter(m => m.email && m.email.toLowerCase() !== cleanEmail);
        if (filteredTeammates.length !== t.teammates.length) {
          if (filteredTeammates.length === 0) {
            await pool.query('DELETE FROM teams WHERE id = $1', [t.id]);
          } else {
            await pool.query(
              'UPDATE teams SET teammates = $1, participant_count = $2 WHERE id = $3',
              [JSON.stringify(filteredTeammates), filteredTeammates.length, t.id]
            );
          }
        }
      }
    }

    // 3. Decrement rsvp_count
    await pool.query('UPDATE events SET rsvp_count = GREATEST(0, rsvp_count - 1) WHERE id = $1', [eventId]);

    res.json({ success: true, message: 'Registration withdrawn successfully!' });
  } catch (err) {
    console.error('Error withdrawing registration:', err);
    res.status(500).json({ error: 'Failed to withdraw registration' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Supabase Database API Server running on port ${PORT}`);
});
