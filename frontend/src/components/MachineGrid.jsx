import MachineCard from './MachineCard';

export default function MachineGrid({ machines, onAction }) {
  const washers = machines.filter((m) => m.type === 'washer');
  const dryers = machines.filter((m) => m.type === 'dryer');

  return (
    <div className="grid-wrapper">
      <section>
        <h2 className="section-title">
          Washers
          <span className="section-count">
            {washers.filter((m) => m.status === 'available').length}/{washers.length} free
          </span>
        </h2>
        <div className="machine-grid">
          {washers.map((m) => (
            <MachineCard key={m.id} machine={m} onAction={onAction} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="section-title">
          Dryers
          <span className="section-count">
            {dryers.filter((m) => m.status === 'available').length}/{dryers.length} free
          </span>
        </h2>
        <div className="machine-grid">
          {dryers.map((m) => (
            <MachineCard key={m.id} machine={m} onAction={onAction} />
          ))}
        </div>
      </section>
    </div>
  );
}
