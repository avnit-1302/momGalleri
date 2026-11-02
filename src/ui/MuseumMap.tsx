import { rooms } from '../world/layout';
import type { RoomId } from '../content/museumContent';
export function MuseumMap({
  current,
  position,
  onNavigate,
}: {
  current: RoomId;
  position: [number, number];
  onNavigate: (id: RoomId) => void;
}) {
  return (
    <>
      <span className="eyebrow">FINN DIN EGEN VEI</span>
      <h2>Seks rom. Ett hjerte.</h2>
      <p className="muted">Velg et rom på kartet, eller fortsett til fots.</p>
      <svg
        className="museum-map"
        viewBox="-33 -34 66 65"
        role="img"
        aria-label="Etasjekart over museets seks rom"
      >
        {rooms.map((room) => {
          const [x1, x2, z1, z2] = room.bounds;
          return (
            <g
              key={room.id}
              role="button"
              tabIndex={0}
              aria-label={`Gå til ${room.name}`}
              onClick={() => onNavigate(room.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onNavigate(room.id);
                }
              }}
              className={room.id === current ? 'map-room selected' : 'map-room'}
            >
              <rect
                x={x1 + 0.6}
                y={z1 + 0.6}
                width={x2 - x1 - 1.2}
                height={z2 - z1 - 1.2}
                rx=".5"
              />
              <text x={(x1 + x2) / 2} y={(z1 + z2) / 2 - 1} className="map-number">
                {room.number}
              </text>
              <text x={(x1 + x2) / 2} y={(z1 + z2) / 2 + 2} className="map-label">
                {room.id === 'sanctuary' ? 'Hjertet i familien' : room.name}
              </text>
            </g>
          );
        })}
        <circle cx="0" cy="0" r="3.9" className="map-pool" />
        <circle cx={position[0]} cy={position[1]} r=".8" className="map-visitor" />
      </svg>
      <div className="map-key">
        <span className="map-dot" /> Du er her <span>Alle rom ligger på samme plan</span>
      </div>
      <div className="room-list">
        {rooms.map((room) => (
          <button key={room.id} onClick={() => onNavigate(room.id)}>
            <span>{room.number}</span>
            {room.name}
            <span>↗</span>
          </button>
        ))}
      </div>
    </>
  );
}
