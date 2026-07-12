const { machines: machineConfig, flagThresholdMinutes } = require('../config/machines.json');
const persist = require('./persist');
const usageLog = require('./usageLog');

const STATUSES = {
  AVAILABLE: 'available',
  RUNNING: 'running',
  UNAVAILABLE: 'unavailable',
};

// In-memory store: machineId -> machine state object
const state = {};
// flagged PINs: pin -> { machineId, flaggedAt }
const flaggedSessions = {};

function initState() {
  const saved = persist.load();
  machineConfig.forEach((m) => {
    const existing = saved?.state?.[m.id];
    state[m.id] = existing ?? {
      id: m.id,
      type: m.type,
      label: m.label,
      status: STATUSES.AVAILABLE,
      pin: null,
      startTime: null,
      cycleDurationMs: null,
      endTime: null,
      flagged: false,
    };
  });
  if (saved?.flaggedSessions) {
    Object.assign(flaggedSessions, saved.flaggedSessions);
  }
}

function randomizeState() {
  Object.values(state).forEach((machine) => {
    const roll = Math.random();
    if (roll < 0.4) {
      // 40% available
      resetMachine(machine.id);
    } else if (roll < 0.75) {
      // 35% running with random remaining time
      const remainingMs = (Math.floor(Math.random() * 50) + 5) * 60 * 1000;
      state[machine.id] = {
        ...state[machine.id],
        status: STATUSES.RUNNING,
        pin: Math.floor(1000 + Math.random() * 9000).toString(),
        startTime: Date.now() - 5000,
        cycleDurationMs: remainingMs + 5000,
        endTime: Date.now() + remainingMs,
        flagged: false,
      };
    } else {
      // 25% unavailable (done, not collected)
      state[machine.id] = {
        ...state[machine.id],
        status: STATUSES.UNAVAILABLE,
        pin: Math.floor(1000 + Math.random() * 9000).toString(),
        startTime: Date.now() - 60 * 60 * 1000,
        cycleDurationMs: 30 * 60 * 1000,
        endTime: Date.now() - 30 * 60 * 1000,
        flagged: false,
      };
    }
  });
  persist.save(state, flaggedSessions);
}

function getAllMachines() {
  return Object.values(state).map((m) => publicView(m));
}

function getMachine(id) {
  return state[id] ? publicView(state[id]) : null;
}

// Returns machine view without exposing PIN
function publicView(machine) {
  const now = Date.now();
  const remainingMs =
    machine.status === STATUSES.RUNNING && machine.endTime
      ? Math.max(0, machine.endTime - now)
      : null;

  return {
    id: machine.id,
    type: machine.type,
    label: machine.label,
    status: machine.status,
    remainingMs,
    endTime: machine.endTime,
    flagged: machine.flagged,
  };
}

function startLoad(machineId, pin, cycleDurationMinutes) {
  const machine = state[machineId];
  if (!machine) return { error: 'Machine not found' };
  if (machine.status !== STATUSES.AVAILABLE) return { error: 'Machine is not available' };
  if (!pin || pin.length < 4) return { error: 'PIN must be at least 4 characters' };
  if (!cycleDurationMinutes || cycleDurationMinutes <= 0) return { error: 'Invalid cycle duration' };

  const cycleDurationMs = cycleDurationMinutes * 60 * 1000;
  const now = Date.now();

  state[machineId] = {
    ...machine,
    status: STATUSES.RUNNING,
    pin,
    startTime: now,
    cycleDurationMs,
    endTime: now + cycleDurationMs,
    flagged: false,
  };

  persist.save(state, flaggedSessions);
  return { success: true, pin, machine: publicView(state[machineId]) };
}

function collectLoad(machineId, pin) {
  const machine = state[machineId];
  if (!machine) return { error: 'Machine not found' };
  if (machine.status === STATUSES.AVAILABLE) return { error: 'Machine is already available' };
  if (machine.pin !== pin) return { error: 'Incorrect PIN' };

  // Clear any flag since the user collected in time (or late — we still allow collection)
  resetMachine(machineId);
  persist.save(state, flaggedSessions);
  return { success: true, machine: publicView(state[machineId]) };
}

function resetMachine(machineId) {
  const machine = state[machineId];
  if (!machine) return;
  state[machineId] = {
    ...machine,
    status: STATUSES.AVAILABLE,
    pin: null,
    startTime: null,
    cycleDurationMs: null,
    endTime: null,
    flagged: false,
  };
}

function adminResetMachine(machineId) {
  const machine = state[machineId];
  if (!machine) return { error: 'Machine not found' };
  resetMachine(machineId);
  persist.save(state, flaggedSessions);
  return { success: true, machine: publicView(state[machineId]) };
}

// Called on an interval to advance machine states
function tick() {
  const now = Date.now();
  const flagThresholdMs = flagThresholdMinutes * 60 * 1000;

  Object.values(state).forEach((machine) => {
    if (machine.status === STATUSES.RUNNING && machine.endTime && now >= machine.endTime) {
      state[machine.id].status = STATUSES.UNAVAILABLE;
    }

    if (
      machine.status === STATUSES.UNAVAILABLE &&
      machine.endTime &&
      now >= machine.endTime + flagThresholdMs &&
      !machine.flagged
    ) {
      state[machine.id].flagged = true;
      if (machine.pin) {
        flaggedSessions[machine.pin] = { machineId: machine.id, flaggedAt: now };
      }
    }
  });

  const busyCount = Object.values(state).filter((m) => m.status !== STATUSES.AVAILABLE).length;
  usageLog.recordSnapshot(busyCount);

  persist.save(state, flaggedSessions);
}

// 7x24 grid (day x hour) of average machines-in-use, for the peak-hours heatmap
function getUsageHeatmap() {
  return { totalMachines: machineConfig.length, grid: usageLog.getHeatmap() };
}

// Quietest upcoming hours based on historical utilization
function getBestTimes(count = 3) {
  return usageLog.getQuietestUpcomingHours(count);
}

function getFlaggedSessions() {
  return { ...flaggedSessions };
}

// Full machine state including PINs, for admin use only
function getFullState() {
  return Object.values(state).map((m) => ({ ...m }));
}

initState();

module.exports = {
  STATUSES,
  getAllMachines,
  getMachine,
  startLoad,
  collectLoad,
  randomizeState,
  tick,
  getFlaggedSessions,
  getFullState,
  adminResetMachine,
  getUsageHeatmap,
  getBestTimes,
};
