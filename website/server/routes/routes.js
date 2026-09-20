import express from 'express';
import { all, get } from '../db/index.js';

const router = express.Router();

// GET /api/routes
router.get('/', async (req, res) => {
  try {
    const routes = await all('SELECT * FROM transit_routes');
    res.json(routes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/routes/:id
router.get('/:id', async (req, res) => {
  try {
    const route = await get('SELECT * FROM transit_routes WHERE id = ?', [req.params.id]);
    if (!route) return res.status(404).json({ error: 'Route not found' });
    res.json(route);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
