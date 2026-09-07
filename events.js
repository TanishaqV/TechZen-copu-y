import pool from '../server/db.js';
import { INITIAL_EVENTS } from '../src/mockData.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-user-email, x-user-id, authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { rows } = await pool.query('SELECT * FROM events ORDER BY created_at DESC');
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
