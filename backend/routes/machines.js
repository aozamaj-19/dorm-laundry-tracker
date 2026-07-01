const express = require('express');
const router = express.Router();
const sm = require('../state/stateManager');
const { requireAdminAuth } = require('../middleware/adminAuth');

// GET /api/machines
router.get('/', (req, res) => {
  res.json(sm.getAllMachines());
});

// GET /api/machines/:id
router.get('/:id', (req, res) => {
  const machine = sm.getMachine(req.params.id);
  if (!machine) return res.status(404).json({ error: 'Machine not found' });
  res.json(machine);
});

// POST /api/machines/:id/start
// Body: { pin: string, cycleDurationMinutes: number }
router.post('/:id/start', (req, res) => {
  const { pin, cycleDurationMinutes } = req.body;
  const result = sm.startLoad(req.params.id, pin, Number(cycleDurationMinutes));
  if (result.error) return res.status(400).json(result);
  res.json(result);
});

// POST /api/machines/:id/collect
// Body: { pin: string }
router.post('/:id/collect', (req, res) => {
  const { pin } = req.body;
  const result = sm.collectLoad(req.params.id, pin);
  if (result.error) return res.status(400).json(result);
  res.json(result);
});

// POST /api/machines/simulate (randomize all states for testing)
router.post('/simulate/randomize', (req, res) => {
  sm.randomizeState();
  res.json({ success: true, machines: sm.getAllMachines() });
});

// GET /api/machines/admin/flagged
router.get('/admin/flagged', requireAdminAuth, (req, res) => {
  res.json(sm.getFlaggedSessions());
});

// GET /api/machines/admin/state (full machine state including PINs)
router.get('/admin/state', requireAdminAuth, (req, res) => {
  res.json(sm.getFullState());
});

module.exports = router;
