const express = require('express');
const cors = require('cors');
const { tick } = require('./state/stateManager');
const machinesRouter = require('./routes/machines');

const app = express();
const PORT = process.env.PORT || 3001;

// credentials: true + reflected origin so the browser will send/prompt for
// Basic Auth on cross-origin admin requests (frontend and backend are on
// different domains in production)
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use('/api/machines', machinesRouter);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Advance machine states every 10 seconds
setInterval(tick, 10_000);

app.listen(PORT, () => {
  console.log(`Laundry tracker backend running on port ${PORT}`);
});
