import { useEffect, useState } from 'react';
import { getUsageHeatmap } from '../api';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function cellColor(intensity) {
  if (intensity === null) return undefined;
  const hue = 130 - intensity * 130; // green (quiet) -> red (busy)
  const light = 92 - intensity * 42;
  return `hsl(${hue}, 65%, ${light}%)`;
}

function formatHourLabel(hour) {
  if (hour === 0) return '12a';
  if (hour === 12) return '12p';
  return hour < 12 ? `${hour}a` : `${hour - 12}p`;
}

export default function Heatmap() {
  const [heatmap, setHeatmap] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getUsageHeatmap()
      .then(setHeatmap)
      .catch((err) => setError(err.message));
  }, []);

  if (error || !heatmap) return null;

  const { totalMachines, grid } = heatmap;

  return (
    <section className="heatmap-section">
      <h2 className="section-title">Peak Hours</h2>
      <div className="heatmap-scroll">
        <div className="heatmap">
          <div className="heatmap__row heatmap__row--header">
            <div className="heatmap__row-label" />
            {Array.from({ length: 24 }, (_, hour) => (
              <div key={hour} className="heatmap__hour-label">
                {hour % 3 === 0 ? formatHourLabel(hour) : ''}
              </div>
            ))}
          </div>
          {grid.map((row, day) => (
            <div key={day} className="heatmap__row">
              <div className="heatmap__row-label">{DAY_LABELS[day]}</div>
              {row.map((avgBusy, hour) => {
                const intensity = avgBusy === null ? null : Math.min(1, avgBusy / totalMachines);
                return (
                  <div
                    key={hour}
                    className="heatmap__cell"
                    style={{ background: cellColor(intensity) }}
                    title={
                      avgBusy === null
                        ? `${DAY_LABELS[day]} ${formatHourLabel(hour)} — no data yet`
                        : `${DAY_LABELS[day]} ${formatHourLabel(hour)} — avg ${avgBusy.toFixed(1)}/${totalMachines} in use`
                    }
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="heatmap__legend">
        <span>Quiet</span>
        <span className="heatmap__legend-bar" />
        <span>Busy</span>
      </div>
    </section>
  );
}
