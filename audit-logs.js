import pool from '../server/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-user-email, x-user-id, authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const { action, details, targetUser, editedBy } = req.body || {};
      if (!action || !details) {
        return res.status(400).json({ error: 'action and details required' });
      }

      const id = `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const editor = editedBy || req.headers['x-user-email'] || 'Tanishaq Verma (Admin)';

      const { rows } = await pool.query(`
        INSERT INTO audit_logs (id, action, details, target_user, edited_by)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
      `, [id, action, details, targetUser || 'Participant', editor]);

      return res.status(201).json(rows[0]);
    } catch (err) {
      console.error('Error recording audit log:', err);
      return res.status(500).json({ error: 'Failed to record audit log' });
    }
  }

  try {
    const { rows } = await pool.query('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 200');
    return res.status(200).json(rows.map(r => ({
      id: r.id,
      action: r.action,
      details: r.details,
      targetUser: r.target_user,
      editedBy: r.edited_by,
      timestamp: r.timestamp
    })));
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    return res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
}
