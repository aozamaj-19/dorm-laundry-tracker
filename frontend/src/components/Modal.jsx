import { useState } from 'react';

export function StartModal({ machine, onConfirm, onClose }) {
  const [pin, setPin] = useState('');
  const [duration, setDuration] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (pin.length < 4) { setError('PIN must be at least 4 characters'); return; }
    const mins = Number(duration);
    if (!mins || mins <= 0 || mins > 180) { setError('Enter a duration between 1 and 180 minutes'); return; }
    try {
      await onConfirm(machine.id, pin, mins);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Start Load — {machine.label}</h3>
        <form onSubmit={handleSubmit}>
          <label>
            PIN (you'll need this to collect)
            <input
              type="text"
              inputMode="numeric"
              maxLength={8}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              autoFocus
              placeholder="e.g. 4821"
            />
          </label>
          <label>
            Cycle duration (minutes)
            <input
              type="number"
              min={1}
              max={180}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g. 35"
            />
          </label>
          {error && <p className="modal__error">{error}</p>}
          <div className="modal__actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn--primary">Start</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function PinConfirmModal({ machine, pin, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Load Started — {machine.label}</h3>
        <p className="modal__pin">
          Your PIN is <strong>{pin}</strong> — you'll need this to collect your laundry.
        </p>
        <div className="modal__actions">
          <button type="button" className="btn btn--primary" onClick={onClose}>Got it</button>
        </div>
      </div>
    </div>
  );
}

export function ConfirmResetModal({ machine, onConfirm, onClose }) {
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function handleConfirm() {
    setError('');
    setPending(true);
    try {
      await onConfirm(machine.id);
      onClose();
    } catch (err) {
      setError(err.message);
      setPending(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Reset {machine.label}?</h3>
        <p className="modal__pin">
          This clears its PIN and timer and sets it back to available. This can't be undone.
        </p>
        {error && <p className="modal__error">{error}</p>}
        <div className="modal__actions">
          <button type="button" className="btn btn--ghost" onClick={onClose} disabled={pending}>Cancel</button>
          <button type="button" className="btn btn--danger" onClick={handleConfirm} disabled={pending}>
            {pending ? 'Resetting…' : 'Reset machine'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function CollectModal({ machine, onConfirm, onClose }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await onConfirm(machine.id, pin);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Collect Load — {machine.label}</h3>
        <form onSubmit={handleSubmit}>
          <label>
            Enter your PIN
            <input
              type="text"
              inputMode="numeric"
              maxLength={8}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              autoFocus
              placeholder="e.g. 4821"
            />
          </label>
          {error && <p className="modal__error">{error}</p>}
          <div className="modal__actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn--primary">Collect</button>
          </div>
        </form>
      </div>
    </div>
  );
}
