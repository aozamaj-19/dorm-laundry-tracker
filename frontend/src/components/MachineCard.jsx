import { useCountdown, formatMs } from '../useCountdown';

const STATUS_LABEL = {
  available: 'Available',
  running: 'Running',
  unavailable: 'Done — Not Collected',
};

export default function MachineCard({ machine, onAction }) {
  const remaining = useCountdown(machine.status === 'running' ? machine.endTime : null);

  const statusClass = `card card--${machine.status}${machine.flagged ? ' card--flagged' : ''}`;

  return (
    <button className={statusClass} onClick={() => onAction(machine)}>
      <span className="card__icon">{machine.type === 'washer' ? '🫧' : '🌀'}</span>
      <span className="card__label">{machine.label}</span>
      <span className="card__status">{STATUS_LABEL[machine.status]}</span>
      {machine.status === 'running' && remaining !== null && (
        <span className="card__timer">{formatMs(remaining)} left</span>
      )}
      {machine.flagged && <span className="card__flag">Flagged</span>}
    </button>
  );
}
