import pg from 'pg';

const connectionString = 'postgresql://postgres:Tm_Ee^MVJ9@vvyk@db.zkuewwwdlydsfpzrfeab.supabase.co:5432/postgres';

const INITIAL_EVENTS = [
  {
    id: 'event-1788625391659',
    title: 'wef',
    tagline: 'Community event hosted on TechZen',
    category: 'HACKATHON',
    badge: 'LIVE HACKATHON',
    format: 'ONLINE',
    locationType: 'ONLINE',
    location: 'TechZen Platform / Online Stream',
    date: 'June 29 - July 20, 2026',
    time: '18:30 - 21:30 IST',
    capacity: 100,
    maxTeamSize: 4,
    allowSolo: true,
    maxTeams: 50,
    rsvpCount: 1,
    coverImage: '/operation-cipher.png',
    imageUrl: '/operation-cipher.png',
    hostName: 'Tanishaq Verma Techzen',
    hostAvatar: 'https://lh3.googleusercontent.com/a/ACg8ocLlnKOcl-oxirLpjfa_8KcUsyX1BFvg47IExOnV6WnCzZOhNg=s96-c',
    hostRole: 'Community Admin',
    description: 'wef',
    tags: ['Hackathon', 'Code', 'Prizes'],
    featured: true,
    agenda: [
      { time: 'Start', title: 'Registration & Coffee', speaker: 'Host' },
      { time: 'Keynote', title: 'wef', speaker: 'Speaker' }
    ],
    customQuestions: [],
    ended: false
  },
  {
    id: 'operation-cipher-2026',
    title: 'Operation Cipher 2026',
    tagline: 'A Money Heist Themed National Level Hackathon. Code. Plan. Execute. Escape.',
    category: 'HACKATHON',
    badge: 'LIVE HACKATHON',
    format: 'ONLINE',
    locationType: 'ONLINE',
    location: 'National Level Online • Powered by Unstop',
    date: 'June 29 - July 20, 2026',
    time: 'National Level Hackathon',
    capacity: 500,
    maxTeamSize: 4,
    allowSolo: true,
    maxTeams: 50,
    rsvpCount: 480,
    coverImage: '/operation-cipher.png',
    imageUrl: '/operation-cipher.png',
    hostName: 'TechZen Team',
    hostAvatar: '/techzen-logo.png',
    hostRole: 'Hackathon Host',
    description: 'THE PLAN. THE CODE. THE ESCAPE.\nTechZen Presents: OPERATION CIPHER — A Money Heist Themed National Level Hackathon. Powered by Unstop.',
    tags: ['Hackathon', 'Money Heist', 'Software Track', 'Hardware Track', 'Unstop'],
    featured: true,
    agenda: [
      { time: 'June 29', title: 'Registration & Cipher Node Access Open', speaker: 'TechZen Node' },
      { time: 'July 1 - July 18', title: '24-Hour Building Phase (Software & Hardware)', speaker: 'Hackers' },
      { time: 'July 20', title: 'Final Blueprint Submission & Jury Evaluation', speaker: 'Jury Panel' }
    ],
    customQuestions: [],
    ended: true
  },
  {
    id: 'quizverse-2026',
    title: 'TechZen QuizVerse 2026',
    tagline: 'Think. Answer. Conquer. The ultimate tech trivia and CS fundamentals challenge.',
    category: 'QUIZ',
    badge: 'QUIZ',
    format: 'ONLINE',
    locationType: 'ONLINE',
    location: 'Online • TechZen Platform',
    date: 'May 12, 2026',
    time: '30 Minutes • 30 MCQs',
    capacity: 600,
    maxTeamSize: 4,
    allowSolo: true,
    maxTeams: 50,
    rsvpCount: 580,
    coverImage: '/quizverse.png',
    imageUrl: '/quizverse.png',
    hostName: 'TechZen Team',
    hostAvatar: '/techzen-logo.png',
    hostRole: 'Quiz Master',
    description: 'TECHZEN PRESENTS: QUIZVERSE 2026\nTHINK. ANSWER. CONQUER.',
    tags: ['Tech Quiz', 'Trivia', 'Computer Science', 'Hardware', 'Prizes'],
    featured: true,
    agenda: [
      { time: '19:00 IST', title: 'Quiz Lobby Opens & Rules Briefing', speaker: 'Quiz Master' },
      { time: '19:10 IST', title: 'Live 30-Minute MCQ Sprint (30 Questions)', speaker: 'Participants' },
      { time: '19:45 IST', title: 'Leaderboard Announcement & Digital E-Certificates', speaker: 'TechZen Team' }
    ],
    customQuestions: [],
    ended: true
  }
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-user-email, x-user-id, authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const pool = new pg.Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 4000
    });
    const { rows } = await pool.query('SELECT * FROM events ORDER BY created_at DESC');
    await pool.end();

    if (rows && rows.length > 0) {
      const mapped = rows.map(row => ({
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
        customQuestions: typeof row.custom_questions === 'string' ? JSON.parse(row.custom_questions) : row.custom_questions,
        ended: row.ended === true
      }));
      return res.status(200).json(mapped);
    }
  } catch (err) {
    console.error('Vercel API DB Error:', err);
  }

  return res.status(200).json(INITIAL_EVENTS);
}
