import express from 'express';
import { all, get, run } from '../db/index.js';
import { seed } from '../db/seed.js';

const router = express.Router();

// GET /api/db/stats - High-level counts
router.get('/stats', async (req, res) => {
  try {
    const homestaysCount = await get('SELECT COUNT(*) as count FROM homestays');
    const bookingsCount = await get('SELECT COUNT(*) as count FROM bookings');
    const usersCount = await get('SELECT COUNT(*) as count FROM users');
    const blockedDatesCount = await get('SELECT COUNT(*) as count FROM room_unavailability');

    res.json({
      homestays: homestaysCount.count,
      bookings: bookingsCount.count,
      users: usersCount.count,
      blockedDates: blockedDatesCount.count,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/db/tables - List all tables and column metadata
router.get('/tables', async (req, res) => {
  try {
    const tables = await all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
    const result = [];

    for (const t of tables) {
      const columns = await all(`PRAGMA table_info(${t.name})`);
      const count = await get(`SELECT COUNT(*) as count FROM ${t.name}`);
      result.push({
        name: t.name,
        count: count.count,
        columns: columns.map(c => ({
          cid: c.cid,
          name: c.name,
          type: c.type,
          notnull: c.notnull === 1,
          dflt_value: c.dflt_value,
          pk: c.pk === 1
        }))
      });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/db/table/:name - Fetch all rows from a table
router.get('/table/:name', async (req, res) => {
  try {
    const { name } = req.params;
    // Prevent SQL injection by verifying table name against sqlite_master
    const tableExists = await get("SELECT name FROM sqlite_master WHERE type='table' AND name = ?", [name]);
    if (!tableExists) {
      return res.status(404).json({ error: `Table '${name}' not found` });
    }

    const rows = await all(`SELECT * FROM ${name} LIMIT 100`);
    const columns = await all(`PRAGMA table_info(${name})`);

    res.json({
      table: name,
      columns,
      rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/db/query - Execute custom query (Admin / Studio exploration)
router.post('/query', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Missing SQL query' });

    const trimmed = query.trim().toUpperCase();
    if (trimmed.startsWith('SELECT') || trimmed.startsWith('PRAGMA')) {
      const rows = await all(query);
      res.json({ type: 'SELECT', rows });
    } else {
      const result = await run(query);
      res.json({ type: 'EXEC', result });
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/db/reset - Reseed database to default state
router.post('/reset', async (req, res) => {
  try {
    await seed();
    res.json({ success: true, message: 'Database reset and reseeded with default Gokarna records' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
