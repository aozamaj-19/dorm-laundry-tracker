import { useEffect, useState, useCallback } from 'react';
import { getAdminState, resetMachine } from '../api';
import { ConfirmResetModal } from './Modal';

const STATUS_LABEL = {
  available: 'Available',
  running: 'Running',
  unavailable: 'Done — Not Collected',
};

export default function AdminPanel() {
  const [machines, setMachines] = useState([]);
  const [error, setError] = useState('');
  const [resetTarget, setResetTarget] = useState(null);

  const fetchState = useCallback(async () => {
    try {
      const data = await getAdminState();
      setMachines(data);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  async function handleReset(id) {
    await resetMachine(id);
    fetchState();
  }

  return (
    <section className="admin-panel">
      <h2 className="section-title">Admin — Full State</h2>
      {error && <div className="banner banner--error">{error}</div>}
      <div className="admin-table">
        {machines.map((m) => (
          <div key={m.id} className="admin-row">
            <span className="admin-row__label">{m.label}</span>
            <span className="admin-row__status">{STATUS_LABEL[m.status]}</span>
            <span className="admin-row__pin">{m.pin ? `PIN ${m.pin}` : '—'}</span>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => setResetTarget(m)}
              disabled={m.status === 'available'}
            >
              Reset
            </button>
          </div>
        ))}
      </div>
      {resetTarget && (
        <ConfirmResetModal
          machine={resetTarget}
          onConfirm={handleReset}
          onClose={() => setResetTarget(null)}
        />
      )}
    </section>
  );
}
