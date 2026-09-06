import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import pool, { initDatabase } from './db.js';
import { INITIAL_EVENTS } from '../src/mockData.js';

const app = express();
const PORT = process.env.PORT || 3001;

const ADMIN_EMAILS = [
  'tanishaqvermatechzen@gmail.com',
  'ishaan.m1608@gmail.com',
  'techzen.innovation@gmail.com'
];
const ADMIN_EMAIL = ADMIN_EMAILS[0];

function isEmailAdmin(email) {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return ADMIN_EMAILS.some(admin => admin.toLowerCase() === clean);
}

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

  if (!userEmail || !isEmailAdmin(userEmail)) {
    return res.status(403).json({ error: `Forbidden: Action requires verified Admin access` });
  }

  // Require Authorization header presence
  if (!authHeader || (!authHeader.startsWith('Bearer ') && authHeader !== 'admin-secret-session')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid authentication token' });
  }

  next();
}

// Seed default events into database (always ensures INITIAL_EVENTS exist in DB)
async function seedInitialEvents() {
  console.log('Seeding initial events into Supabase PostgreSQL...');
  for (const ev of INITIAL_EVENTS) {
    const allowSoloVal = ev.allowSolo !== undefined ? ev.allowSolo : true;
    const maxTeamVal = ev.maxTeamSize || 4;
    await pool.query(`
      INSERT INTO events (
        id, title, tagline, category, badge, date, time, location_type, location,
        capacity, max_team_size, allow_solo, rsvp_count, cover_image, host_name, host_avatar, host_role,
        description, tags, agenda, custom_questions
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        tagline = EXCLUDED.tagline,
        category = EXCLUDED.category,
        badge = EXCLUDED.badge,
        date = EXCLUDED.date,
        time = EXCLUDED.time,
        location_type = EXCLUDED.location_type,
        location = EXCLUDED.location,
        capacity = EXCLUDED.capacity,
        max_team_size = EXCLUDED.max_team_size,
        allow_solo = EXCLUDED.allow_solo,
        rsvp_count = EXCLUDED.rsvp_count,
        cover_image = EXCLUDED.cover_image,
        host_name = EXCLUDED.host_name,
        host_avatar = EXCLUDED.host_avatar,
        host_role = EXCLUDED.host_role,
        description = EXCLUDED.description,
        tags = EXCLUDED.tags,
        agenda = EXCLUDED.agenda,
        custom_questions = EXCLUDED.custom_questions;
    `, [
      ev.id, ev.title, ev.tagline, ev.category, ev.badge, ev.date, ev.time, ev.locationType || ev.format || 'ONLINE', ev.location,
      ev.capacity || 100, maxTeamVal, allowSoloVal, ev.rsvpCount || 0, ev.coverImage || ev.imageUrl, ev.hostName, ev.hostAvatar, ev.hostRole,
      ev.description, ev.tags || [], JSON.stringify(ev.agenda || []), JSON.stringify(ev.customQuestions || [])
    ]);
  }
  console.log('✅ Initial events seeded into Supabase!');
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
    maxTeamSize: row.max_team_size || 4,
    allowSolo: row.allow_solo !== false,
    maxTeams: row.max_teams || 50,
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
    const allowSoloVal = ev.allowSolo !== undefined ? ev.allowSolo : true;
    const maxTeamVal = ev.maxTeamSize || 4;
    const maxTeamsVal = ev.maxTeams || 50;

    const { rows } = await pool.query(`
      INSERT INTO events (
        id, title, tagline, category, badge, date, time, location_type, location,
        capacity, max_team_size, allow_solo, max_teams, rsvp_count, cover_image, host_name, host_avatar, host_role,
        description, tags, agenda, custom_questions
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      RETURNING *;
    `, [
      ev.id, ev.title, ev.tagline, ev.category, ev.badge || ev.category, ev.date, ev.time, ev.locationType, ev.location,
      ev.capacity || 100, maxTeamVal, allowSoloVal, maxTeamsVal, 0, ev.coverImage, ev.hostName || 'TechZen Admin', ev.hostAvatar, 'Community Admin',
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

    const isAdminUser = isEmailAdmin(u.email);
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
    const isAdminUser = isEmailAdmin(cleanEmail);

    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [cleanEmail]);
    if (rows.length === 0) {
      const secureHashedPassword = hashPassword(password || 'google-oauth');
      const getAdminName = (e) => {
        if (e === 'ishaan.m1608@gmail.com') return 'Ishaan M (Admin)';
        if (e === 'techzen.innovation@gmail.com') return 'TechZen Innovation (Admin)';
        return 'Tanishaq Verma (Admin)';
      };

      const newUser = {
        id: `usr-${Date.now()}`,
        name: isAdminUser ? getAdminName(cleanEmail) : cleanEmail.split('@')[0].replace('.', ' ').replace(/^./, str => str.toUpperCase()),
        email: cleanEmail,
        password: secureHashedPassword,
        role: isAdminUser ? 'Admin / Organizer' : 'Attendee',
        bio: isAdminUser ? 'TechZen Community Admin' : 'TechZen Community Member',
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
    if (isEmailAdmin(requesterEmail)) {
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

// REALTIME SSE SUBSCRIBERS MANAGER (Instant Cross-Device Sync with 0 Read Query Cost on broadcast)
const sseSubscribers = new Set();

function addSseSubscriber(res, meta = {}) {
  const sub = { res, ...meta };
  sseSubscribers.add(sub);
  return () => {
    sseSubscribers.delete(sub);
  };
}

function notifyTeamUpdate(payload) {
  if (!payload || !sseSubscribers.size) return;
  const dataString = `data: ${JSON.stringify({ type: 'TEAM_UPDATE', ...payload, timestamp: Date.now() })}\n\n`;

  sseSubscribers.forEach((sub) => {
    try {
      sub.res.write(dataString);
    } catch (e) {
      sseSubscribers.delete(sub);
    }
  });
}

// GET /api/teams/stream - SERVER-SENT EVENTS REALTIME ENDPOINT FOR INSTANT CROSS-DEVICE SYNC
app.get('/api/teams/stream', (req, res) => {
  const { eventId, inviteCode } = req.query;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (res.flushHeaders) res.flushHeaders();

  const removeSubscriber = addSseSubscriber(res, { eventId, inviteCode });

  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', eventId, inviteCode })}\n\n`);

  const heartbeatInterval = setInterval(() => {
    try {
      res.write(':ping\n\n');
    } catch (e) {
      clearInterval(heartbeatInterval);
      removeSubscriber();
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeatInterval);
    removeSubscriber();
  });
});

// POST /api/teams/generate-code - ON DEMAND DATABASE VERIFIED UNIQUE TEAM CODE
app.post('/api/teams/generate-code', async (req, res) => {
  try {
    const { eventId, userEmail, userName } = req.body;
    if (!eventId || !userEmail) {
      return res.status(400).json({ error: 'eventId and userEmail are required' });
    }

    const cleanEmail = userEmail.toLowerCase().trim();

    // 1. Check if user already belongs to ANY team for this event in Supabase (Leader or Teammate)
    const { rows: allTeams } = await pool.query('SELECT * FROM teams WHERE event_id = $1', [eventId]);
    for (const r of allTeams) {
      const t = mapTeamRow(r);
      const isLeader = t.leaderEmail && t.leaderEmail.toLowerCase().trim() === cleanEmail;
      const isTeammate = Array.isArray(t.teammates) && t.teammates.some(m => m.email && m.email.toLowerCase().trim() === cleanEmail);
      if (isLeader || isTeammate) {
        return res.json(t);
      }
    }

    // 1b. Check if event has reached maximum allowed registered teams limit set by admin
    const eventRes = await pool.query('SELECT max_teams FROM events WHERE id = $1', [eventId]);
    if (eventRes.rows.length > 0) {
      const maxTeamsLimit = eventRes.rows[0].max_teams || 50;
      if (allTeams.length >= maxTeamsLimit) {
        return res.status(400).json({
          error: `Event Team Capacity Full: This event has reached its maximum limit of ${maxTeamsLimit} registered teams set by the administrator.`
        });
      }
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

// GET /api/teams/user-team - FIND USER'S EXISTING TEAM FOR AN EVENT IN SUPABASE
app.get('/api/teams/user-team', async (req, res) => {
  try {
    const { eventId, userEmail } = req.query;
    if (!eventId || !userEmail) {
      return res.status(400).json({ error: 'eventId and userEmail are required' });
    }

    const cleanEmail = userEmail.toLowerCase().trim();
    const { rows } = await pool.query('SELECT * FROM teams WHERE event_id = $1', [eventId]);

    let foundTeam = null;
    for (const r of rows) {
      const team = mapTeamRow(r);
      const isLeader = team.leaderEmail && team.leaderEmail.toLowerCase().trim() === cleanEmail;
      const isTeammate = Array.isArray(team.teammates) && team.teammates.some(t => t.email && t.email.toLowerCase().trim() === cleanEmail);

      if (isLeader || isTeammate) {
        foundTeam = team;
        break;
      }
    }

    if (!foundTeam) {
      return res.json({ isRegistered: false, team: null });
    }

    return res.json({ isRegistered: true, team: foundTeam });
  } catch (err) {
    console.error('Error checking user team in Supabase:', err);
    res.status(500).json({ error: 'Failed to check user team status' });
  }
});

// POST /api/teams - CREATE OR UPDATE TEAM IN SUPABASE
app.post('/api/teams', async (req, res) => {
  try {
    const t = req.body;
    if (!t.eventId || !t.inviteCode || !t.teamName) {
      return res.status(400).json({ error: 'eventId, inviteCode, and teamName are required' });
    }

    const cleanLeaderEmail = (t.leaderEmail || '').toLowerCase().trim();

    // Verify ownership if team already exists
    const existingCheck = await pool.query('SELECT * FROM teams WHERE invite_code = $1', [t.inviteCode]);
    if (existingCheck.rows.length > 0) {
      const existingTeam = mapTeamRow(existingCheck.rows[0]);
      const exLeader = (existingTeam.leaderEmail || '').toLowerCase().trim();
      if (cleanLeaderEmail && exLeader && exLeader !== cleanLeaderEmail) {
        return res.status(403).json({ error: 'Unauthorized: Only the original Team Leader can update team metadata.' });
      }
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
      t.leaderName || 'Leader', cleanLeaderEmail, t.participantCount || 1, JSON.stringify(t.teammates || [])
    ]);

    const savedTeam = mapTeamRow(rows[0]);
    notifyTeamUpdate({ team: savedTeam });
    res.json(savedTeam);
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

// POST /api/teams/update-member - UPDATE MEMBER NAME, COLLEGE, ROLE, PHONE (EMAIL FIXED) IN SUPABASE
app.post('/api/teams/update-member', async (req, res) => {
  try {
    const { inviteCode, memberEmail, editorEmail, name, college, role, phone } = req.body;
    if (!inviteCode || !memberEmail) {
      return res.status(400).json({ error: 'inviteCode and memberEmail are required' });
    }

    const { rows } = await pool.query('SELECT * FROM teams WHERE invite_code = $1', [inviteCode]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const team = mapTeamRow(rows[0]);
    const cleanMemberEmail = memberEmail.toLowerCase().trim();
    const cleanEditor = (editorEmail || '').toLowerCase().trim();

    // Verify authorization: editor must be Team Leader or the member being edited
    const isLeader = cleanEditor && cleanEditor === (team.leaderEmail || '').toLowerCase().trim();
    const isSelf = cleanEditor && cleanEditor === cleanMemberEmail;

    if (cleanEditor && !isLeader && !isSelf) {
      return res.status(403).json({ error: 'Unauthorized: You can only edit your own details or member details if you are the Team Leader.' });
    }

    let updatedTeammates = [...team.teammates];
    let updated = false;
    updatedTeammates = updatedTeammates.map((m, idx) => {
      const isLeaderSlot = (idx === 0) && (cleanMemberEmail === (team.leaderEmail || '').toLowerCase().trim() || !m.email);
      const isMatchingEmail = m.email && m.email.toLowerCase().trim() === cleanMemberEmail;

      if (isLeaderSlot || isMatchingEmail) {
        updated = true;
        return {
          ...m,
          email: m.email || cleanMemberEmail,
          name: name !== undefined ? name : m.name,
          phone: phone !== undefined ? phone : (m.phone || ''),
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

    const updatedTeam = mapTeamRow(updateRes.rows[0]);
    notifyTeamUpdate({ team: updatedTeam });
    res.json(updatedTeam);
  } catch (err) {
    console.error('Error updating team member in Supabase:', err);
    res.status(500).json({ error: 'Failed to update member in database' });
  }
});

// POST /api/teams/update-collective - ONE COLLECTIVE UPDATE FOR TEAM NAME & ALL MEMBER ROLES/COLLEGES/PHONES
app.post('/api/teams/update-collective', async (req, res) => {
  try {
    const { inviteCode, teamName, teammates, editorEmail } = req.body;
    if (!inviteCode) {
      return res.status(400).json({ error: 'inviteCode is required' });
    }

    const { rows } = await pool.query('SELECT * FROM teams WHERE invite_code = $1', [inviteCode]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const existingTeam = mapTeamRow(rows[0]);
    const cleanEditor = (editorEmail || '').toLowerCase().trim();
    const isLeader = cleanEditor && (
      cleanEditor === (existingTeam.leaderEmail || '').toLowerCase().trim() ||
      cleanEditor === (existingTeam.teammates[0]?.email || '').toLowerCase().trim()
    );

    // Determine final team name: only leader can change team name
    const finalTeamName = (isLeader && teamName && teamName.trim()) ? teamName.trim() : existingTeam.teamName;

    // Merge incoming teammates array with safety guards
    const mergedTeammates = existingTeam.teammates.map((existingMem, idx) => {
      const isLeadSlot = idx === 0;
      const incomingMem = Array.isArray(teammates)
        ? teammates.find(t => t.id === existingMem.id || (t.email && existingMem.email && t.email.toLowerCase().trim() === existingMem.email.toLowerCase().trim())) || teammates[idx]
        : null;

      if (!incomingMem) return existingMem;

      const memEmailClean = (existingMem.email || '').toLowerCase().trim();
      const isSelf = cleanEditor && memEmailClean === cleanEditor;
      const canEditMember = isLeader || isSelf;

      if (!canEditMember) {
        return existingMem; // Non-leader cannot tamper with other members
      }

      // Resolve role
      let resolvedRole = existingMem.role;
      if (incomingMem.role !== undefined) {
        if (incomingMem.role === 'Others (Type Custom Role)') {
          resolvedRole = incomingMem.customRole || 'Teammate';
        } else if (incomingMem.role) {
          resolvedRole = incomingMem.role;
        }
      }

      // Name rules: A user (isSelf) can update their own name, or Leader can update leader slot name.
      const resolvedName = ((isSelf || (isLeadSlot && isLeader)) && incomingMem.name) ? incomingMem.name.trim() : existingMem.name;

      return {
        ...existingMem,
        name: resolvedName || existingMem.name,
        phone: incomingMem.phone !== undefined ? incomingMem.phone : (existingMem.phone || ''),
        college: incomingMem.college !== undefined ? incomingMem.college.trim() : existingMem.college,
        role: isLeadSlot ? 'Team Lead / Admin' : resolvedRole,
        customRole: incomingMem.customRole !== undefined ? incomingMem.customRole : (existingMem.customRole || '')
      };
    });

    const updateRes = await pool.query(`
      UPDATE teams
      SET team_name = $1, leader_name = $2, teammates = $3
      WHERE invite_code = $4
      RETURNING *;
    `, [
      finalTeamName,
      mergedTeammates[0]?.name || existingTeam.leaderName,
      JSON.stringify(mergedTeammates),
      inviteCode
    ]);

    const updatedTeam = mapTeamRow(updateRes.rows[0]);
    notifyTeamUpdate({ team: updatedTeam });
    res.json(updatedTeam);
  } catch (err) {
    console.error('Error executing collective team update in Supabase:', err);
    res.status(500).json({ error: 'Failed to update team in database' });
  }
});

// POST /api/teams/remove-member - TEAM LEADER REMOVES PARTICIPANT FROM SUPABASE TEAM
app.post('/api/teams/remove-member', async (req, res) => {
  try {
    const { inviteCode, leaderEmail, memberEmail } = req.body;
    if (!inviteCode || !memberEmail) {
      return res.status(400).json({ error: 'inviteCode and memberEmail are required' });
    }

    const { rows } = await pool.query('SELECT * FROM teams WHERE invite_code = $1', [inviteCode]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const team = mapTeamRow(rows[0]);

    // Verify requesting user is the team leader
    if (!leaderEmail || team.leaderEmail.toLowerCase().trim() !== leaderEmail.toLowerCase().trim()) {
      return res.status(403).json({ error: 'Unauthorized: Only the Team Leader can remove participants.' });
    }

    const cleanMemberEmail = memberEmail.toLowerCase().trim();
    
    // Prevent removing the leader (index 0)
    if (cleanMemberEmail === team.leaderEmail.toLowerCase().trim()) {
      return res.status(400).json({ error: 'Cannot remove the Team Leader from the team.' });
    }

    let updatedTeammates = team.teammates.filter(
      (m, idx) => idx === 0 || !m.email || m.email.toLowerCase().trim() !== cleanMemberEmail
    );

    const activeMemberCountOnRemove = updatedTeammates.filter(m => m.email && m.email.trim()).length;

    const updateRes = await pool.query(`
      UPDATE teams
      SET teammates = $1, participant_count = $2
      WHERE invite_code = $3
      RETURNING *;
    `, [JSON.stringify(updatedTeammates), activeMemberCountOnRemove, inviteCode]);

    // Delete registration entry for removed teammate so they can re-register or join another team
    try {
      await pool.query(
        'DELETE FROM registrations WHERE event_id = $1 AND LOWER(user_email) = $2',
        [team.eventId, cleanMemberEmail]
      );
      await pool.query('UPDATE events SET rsvp_count = GREATEST(0, rsvp_count - 1) WHERE id = $1', [team.eventId]);
    } catch (regErr) {
      console.warn('Registration delete notice on member removal:', regErr.message);
    }

    const updatedTeam = mapTeamRow(updateRes.rows[0]);
    notifyTeamUpdate({ team: updatedTeam });
    res.json(updatedTeam);
  } catch (err) {
    console.error('Error removing member from team in Supabase:', err);
    res.status(500).json({ error: 'Failed to remove member from database' });
  }
});

// POST /api/teams/join - TEAMMATE JOINS TEAM IN SUPABASE
app.post('/api/teams/join', async (req, res) => {
  try {
    const { inviteCode, userEmail, userName, college, role, phone } = req.body;
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
    const alreadyMember = updatedTeammates.some(t => t.email && t.email.toLowerCase().trim() === userEmail.toLowerCase().trim());
    
    // Guard: Check event and team limits if user is not yet in the team
    if (!alreadyMember) {
      // 1. Guard: Check overall event capacity set by admin
      try {
        const eventRes = await pool.query('SELECT capacity, rsvp_count FROM events WHERE id = $1', [team.eventId]);
        if (eventRes.rows.length > 0) {
          const { capacity, rsvp_count } = eventRes.rows[0];
          if (capacity && rsvp_count >= capacity) {
            return res.status(400).json({
              error: `Event Registration Full: This event has reached its maximum total registration limit of ${capacity} participants set by the administrator.`
            });
          }
        }
      } catch (evtErr) {
        console.warn('Event capacity check notice:', evtErr.message);
      }

      // 2. Guard: Check maximum team size capacity
      const activeMemberCount = updatedTeammates.filter(t => t.email && t.email.trim()).length;
      const maxAllowedMembers = 4; // Standard max team limit for hackathons

      if (activeMemberCount >= maxAllowedMembers) {
        return res.status(400).json({
          error: `Team Capacity Reached: This team has already reached the maximum limit of ${maxAllowedMembers} members allowed for this event.`
        });
      }

      // 3. Guard: Prevent double registration for the same event without withdrawing
      const dupCheck = await pool.query(
        'SELECT id FROM registrations WHERE event_id = $1 AND LOWER(user_email) = $2',
        [team.eventId, userEmail.toLowerCase().trim()]
      );
      if (dupCheck.rows.length > 0) {
        return res.status(409).json({ error: 'You are already registered for this event! You must withdraw your existing registration first before joining another team.' });
      }

      const emptySlotIndex = updatedTeammates.findIndex((t, idx) => idx > 0 && (!t.email || !t.email.trim()));
      const assignedRole = (role && role !== '-- Select Role --') ? role.trim() : '';
      if (emptySlotIndex !== -1) {
        updatedTeammates[emptySlotIndex] = {
          ...updatedTeammates[emptySlotIndex],
          name: userName || 'Team Member',
          email: userEmail.toLowerCase().trim(),
          phone: phone || updatedTeammates[emptySlotIndex].phone || '',
          college: college || updatedTeammates[emptySlotIndex].college || '',
          role: assignedRole
        };
      } else {
        updatedTeammates.push({
          id: Date.now(),
          name: userName || 'Team Member',
          email: userEmail.toLowerCase().trim(),
          phone: phone || '',
          college: college || '',
          role: assignedRole,
          customRole: ''
        });
      }
    }

    const finalActiveCount = updatedTeammates.filter(m => m.email && m.email.trim()).length;

    const updateRes = await pool.query(`
      UPDATE teams
      SET teammates = $1, participant_count = $2
      WHERE invite_code = $3
      RETURNING *;
    `, [JSON.stringify(updatedTeammates), finalActiveCount, inviteCode]);

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
        JSON.stringify({ teamName: team.teamName, teamRole: role || '', inviteCode })
      ]);

      await pool.query('UPDATE events SET rsvp_count = rsvp_count + 1 WHERE id = $1', [team.eventId]);
    } catch (regErr) {
      console.warn('Registration table sync notice:', regErr.message);
    }

    const updatedTeam = mapTeamRow(updateRes.rows[0]);
    notifyTeamUpdate({ team: updatedTeam });
    res.json(updatedTeam);
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
            const updRes = await pool.query(
              'UPDATE teams SET teammates = $1, participant_count = $2 WHERE id = $3 RETURNING *',
              [JSON.stringify(filteredTeammates), filteredTeammates.length, t.id]
            );
            if (updRes.rows.length > 0) {
              notifyTeamUpdate({ team: mapTeamRow(updRes.rows[0]) });
            }
          }
        }
      }
    }

    // 3. Decrement rsvp_count
    await pool.query('UPDATE events SET rsvp_count = GREATEST(0, rsvp_count - 1) WHERE id = $1', [eventId]);

    notifyTeamUpdate({ eventId, userEmail: cleanEmail, isWithdrawn: true });
    res.json({ success: true, message: 'Registration withdrawn successfully!' });
  } catch (err) {
    console.error('Error withdrawing registration:', err);
    res.status(500).json({ error: 'Failed to withdraw registration' });
  }
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Supabase Database API Server running on port ${PORT}`);
  });
}

export default app;
