const fs = require('fs');
const path = require('path');

const USAGE_LOG_PATH = path.join(__dirname, 'state', 'usage-log.json');
const MIN_USAGE_SAMPLES = 100;

function usageLogSampleCount() {
  try {
    const parsed = JSON.parse(fs.readFileSync(USAGE_LOG_PATH, 'utf8'));
    if (!Array.isArray(parsed.grid)) return 0;
    return parsed.grid.reduce(
      (sum, day) => sum + day.reduce((daySum, cell) => daySum + cell.samples, 0),
      0
    );
  } catch {
    return 0;
  }
}

// usageLog.js loads usage-log.json into memory the moment it's required (via
// stateManager below), so seeding has to happen before that require runs.
if (usageLogSampleCount() < MIN_USAGE_SAMPLES) {
  console.log('usage-log.json has too little history — seeding realistic dorm usage data...');
  require('./scripts/seedUsageLog')();
}

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
