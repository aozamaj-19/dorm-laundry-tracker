import { useEffect, useState } from 'react';
import { getBestTimes } from '../api';

export default function BestTimes() {
  const [times, setTimes] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getBestTimes()
      .then((data) => setTimes(data.times))
      .catch((err) => setError(err.message));
  }, []);

  if (error || !times || times.length === 0) return null;

  const hasHistory = times.some((t) => t.avgBusy !== null);
  const label = times.map((t) => (t.tomorrow ? `${t.label} (tomorrow)` : t.label)).join(', ');

  return (
    <div className="banner banner--tip">
      <strong>Best times to do laundry:</strong> {label}
      {!hasHistory && (
        <span className="banner__note"> — not enough history yet, showing the next few hours</span>
      )}
    </div>
  );
}
