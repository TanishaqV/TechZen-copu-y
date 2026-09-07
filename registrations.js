import pool from '../server/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-user-email, x-user-id, authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const requesterEmail = (req.headers['x-user-email'] || req.query.email || '').toString().toLowerCase();
    const requesterId = (req.headers['x-user-id'] || req.query.userId || '').toString();

    const adminEmails = [
      'tanishaqvermatechzen@gmail.com',
      'ishaan.m1608@gmail.com',
      'techzen.innovation@gmail.com'
    ];
    const isAdmin = adminEmails.some(a => a.toLowerCase() === requesterEmail);

    if (isAdmin) {
      const { rows } = await pool.query('SELECT * FROM registrations ORDER BY registered_at DESC');
      return res.status(200).json(rows.map(r => ({
        id: r.id,
        eventId: r.event_id,
        userId: r.user_id,
        userName: r.user_name,
        userEmail: r.user_email,
        ticketCode: r.ticket_code,
        answers: typeof r.answers === 'string' ? JSON.parse(r.answers) : r.answers,
        checkedIn: r.checked_in,
        registeredAt: r.registered_at
      })));
    }

    if (requesterEmail || requesterId) {
      const { rows } = await pool.query(
        'SELECT * FROM registrations WHERE LOWER(user_email) = $1 OR user_id = $2 ORDER BY registered_at DESC',
        [requesterEmail, requesterId]
      );
      return res.status(200).json(rows.map(r => ({
        id: r.id,
        eventId: r.event_id,
        userId: r.user_id,
        userName: r.user_name,
        userEmail: r.user_email,
        ticketCode: r.ticket_code,
        answers: typeof r.answers === 'string' ? JSON.parse(r.answers) : r.answers,
        checkedIn: r.checked_in,
        registeredAt: r.registered_at
      })));
    }
  } catch (err) {
    console.error('Vercel API Registrations Error:', err);
  }

  return res.status(200).json([]);
}
