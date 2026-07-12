import { useState, useEffect, useCallback } from 'react';
import MachineGrid from './components/MachineGrid';
import AdminPanel from './components/AdminPanel';
import BestTimes from './components/BestTimes';
import Heatmap from './components/Heatmap';
import { StartModal, CollectModal, PinConfirmModal } from './components/Modal';
import { getMachines, startLoad, collectLoad, randomizeState } from './api';
import './index.css';

export default function App() {
  const [machines, setMachines] = useState([]);
  const [selected, setSelected] = useState(null);
  const [pinConfirm, setPinConfirm] = useState(null);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);

  const fetchMachines = useCallback(async () => {
    try {
      const data = await getMachines();
      setMachines(data);
      setLastUpdated(new Date());
      setError('');
    } catch {
      setError('Could not reach the server. Is the backend running?');
    }
  }, []);

  useEffect(() => {
    async function initialLoad() {
      const data = await getMachines().catch(() => null);
      if (data && data.length > 0 && data.every((m) => m.status === 'available')) {
        await randomizeState().catch(() => {});
      }
      fetchMachines();
    }
    initialLoad();
    const id = setInterval(fetchMachines, 10_000);
    return () => clearInterval(id);
  }, [fetchMachines]);

  function handleCardClick(machine) {
    if (machine.status === 'available') setSelected({ mode: 'start', machine });
    else setSelected({ mode: 'collect', machine });
  }

  async function handleStart(id, pin, mins) {
    const machine = selected.machine;
    const result = await startLoad(id, pin, mins);
    setSelected(null);
    setPinConfirm({ machine, pin: result.pin });
    fetchMachines();
  }

  async function handleCollect(id, pin) {
    await collectLoad(id, pin);
    setSelected(null);
    fetchMachines();
  }

  const available = machines.filter((m) => m.status === 'available').length;

  return (
    <div className="app">
      <header className="header">
        <div className="header__inner">
          <div>
            <h1 className="header__title">Dorm Laundry</h1>
            <p className="header__sub">
              {machines.length
                ? `${available} of ${machines.length} machines free`
                : 'Loading…'}
            </p>
          </div>
          <div className="header__actions">
            {lastUpdated && (
              <span className="header__updated">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button className="btn btn--primary btn--sm" onClick={fetchMachines}>
              Refresh
            </button>
            <button className="btn btn--ghost btn--sm" onClick={() => setShowAdmin((v) => !v)}>
              {showAdmin ? 'Hide Admin' : 'Admin'}
            </button>
          </div>
        </div>
      </header>

      <main className="main">
        {error && <div className="banner banner--error">{error}</div>}
        <BestTimes />
        {machines.length > 0 && (
          <MachineGrid machines={machines} onAction={handleCardClick} />
        )}
        <Heatmap />
        {showAdmin && <AdminPanel />}
      </main>

      {selected?.mode === 'start' && (
        <StartModal
          machine={selected.machine}
          onConfirm={handleStart}
          onClose={() => setSelected(null)}
        />
      )}
      {selected?.mode === 'collect' && (
        <CollectModal
          machine={selected.machine}
          onConfirm={handleCollect}
          onClose={() => setSelected(null)}
        />
      )}
      {pinConfirm && (
        <PinConfirmModal
          machine={pinConfirm.machine}
          pin={pinConfirm.pin}
          onClose={() => setPinConfirm(null)}
        />
      )}
    </div>
  );
}
