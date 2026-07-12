const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'state.json');

function load() {
  try {
    const raw = fs.readFileSync(FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function save(state) {
  fs.writeFileSync(FILE, JSON.stringify({ state }, null, 2), 'utf8');
}

module.exports = { load, save };
