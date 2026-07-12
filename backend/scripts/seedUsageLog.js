const fs = require('fs');
const path = require('path');
const { machines } = require('../config/machines.json');

const USAGE_LOG_PATH = path.join(__dirname, '..', 'state', 'usage-log.json');
const DAYS = 7; // 0 = Sunday ... 6 = Saturday (matches Date#getDay)
const HOURS = 24;
const TOTAL_MACHINES = machines.length;

// Baseline occupancy fraction (0-1) per hour of day: quiet overnight, ramping
// up through the day, peaking in the evening after class/work.
const HOURLY_BASELINE = [
  0.05, 0.03, 0.02, 0.02, 0.02, 0.03, 0.06, 0.12,
  0.18, 0.22, 0.25, 0.28, 0.32, 0.30, 0.28, 0.30,
  0.35, 0.45, 0.55, 0.65, 0.70, 0.68, 0.55, 0.30,
];

// Day-of-week multiplier — Sunday is the classic laundry day, Friday dips
// as people head out for the night.
const DAY_MULTIPLIER = [1.3, 0.9, 0.85, 0.9, 0.95, 0.8, 1.1];

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

// Writes a realistic 7x24 usage history to usage-log.json so the heatmap
// and best-times features have meaningful data from a fresh install.
function seedUsageLog() {
  const grid = Array.from({ length: DAYS }, (_, day) =>
    Array.from({ length: HOURS }, (_, hour) => {
      const fraction = Math.min(
        0.95,
        HOURLY_BASELINE[hour] * DAY_MULTIPLIER[day] * randomBetween(0.85, 1.15)
      );
      const samples = Math.round(randomBetween(40, 90));
      const busySum = Math.round(fraction * TOTAL_MACHINES * samples);
      return { samples, busySum };
    })
  );

  fs.writeFileSync(USAGE_LOG_PATH, JSON.stringify({ grid }, null, 2), 'utf8');
  return grid;
}

module.exports = seedUsageLog;

if (require.main === module) {
  seedUsageLog();
  console.log(`Seeded ${USAGE_LOG_PATH} with realistic dorm usage history.`);
}
