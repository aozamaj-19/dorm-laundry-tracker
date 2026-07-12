const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'usage-log.json');
const DAYS = 7; // 0 = Sunday ... 6 = Saturday (matches Date#getDay)
const HOURS = 24;

function emptyGrid() {
  return Array.from({ length: DAYS }, () =>
    Array.from({ length: HOURS }, () => ({ samples: 0, busySum: 0 }))
  );
}

function load() {
  try {
    const raw = fs.readFileSync(FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.grid) && parsed.grid.length === DAYS) return parsed;
  } catch {
    // no file yet, or corrupt — start fresh
  }
  return { grid: emptyGrid() };
}

const data = load();

function save() {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2), 'utf8');
}

// Called every tick() — accumulates a running average of machines in use
// per (day-of-week, hour-of-day) bucket. Buckets never expire, so each cell
// is an all-time average for that slot (gets more accurate the longer the
// server runs).
function recordSnapshot(busyCount, now = new Date()) {
  const cell = data.grid[now.getDay()][now.getHours()];
  cell.samples += 1;
  cell.busySum += busyCount;
  save();
}

function cellAverage(cell) {
  return cell.samples === 0 ? null : cell.busySum / cell.samples;
}

// 7x24 grid (day x hour) of average machines-in-use, or null where no data yet
function getHeatmap() {
  return data.grid.map((day) => day.map(cellAverage));
}

function formatHourLabel(hour) {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}${hour < 12 ? 'am' : 'pm'}`;
}

// Looks at the next `hoursAhead` hourly slots (starting with the upcoming
// hour) and returns the `count` slots with the lowest historical average
// utilization, in chronological order. Falls back to the next few hours
// as-is if there's no history yet.
function getQuietestUpcomingHours(count = 3, now = new Date(), hoursAhead = 24) {
  const candidates = [];
  for (let offset = 1; offset <= hoursAhead; offset++) {
    const t = new Date(now.getTime() + offset * 60 * 60 * 1000);
    const cell = data.grid[t.getDay()][t.getHours()];
    candidates.push({
      hour: t.getHours(),
      label: formatHourLabel(t.getHours()),
      tomorrow: t.toDateString() !== now.toDateString(),
      avgBusy: cellAverage(cell),
      sortKey: t.getTime(),
    });
  }

  const hasData = candidates.some((c) => c.avgBusy !== null);
  const ranked = hasData
    ? [...candidates].sort((a, b) => (a.avgBusy ?? Infinity) - (b.avgBusy ?? Infinity))
    : candidates;

  return ranked
    .slice(0, count)
    .sort((a, b) => a.sortKey - b.sortKey)
    .map(({ hour, label, tomorrow, avgBusy }) => ({ hour, label, tomorrow, avgBusy }));
}

module.exports = { recordSnapshot, getHeatmap, getQuietestUpcomingHours };
