import {
  Component,
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  assetUrl,
  museumContent,
  photographs,
  type Photograph,
  type RoomId,
} from './content/museumContent';
import { rooms } from './world/layout';
import type { Destination, VisitorInput } from './world/VisitorControls';
import type { Quality } from './world/Museum';
import { Icon, SeahorseMark, type IconName } from './ui/Icons';
import { Dialog } from './ui/Dialog';
import { MuseumMap } from './ui/MuseumMap';
import { TouchControls } from './ui/TouchControls';
import { useAmbience } from './ui/useAmbience';

const Museum = lazy(() => import('./world/Museum'));
type Panel = 'map' | 'menu' | 'help' | 'collection' | 'photo' | 'video' | null;
class SceneBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2');
    if (!context) return false;
    context.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}
function SafeImage({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return failed ? (
    <div className={`missing-image ${className}`}>
      <Icon name="image" size={36} />
      <p>Bildet er ikke tilgjengelig ennå.</p>
    </div>
  ) : (
    <img src={assetUrl(src)} alt={alt} className={className} onError={() => setFailed(true)} />
  );
}
function VideoMessage({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <p className="muted">Videohilsenen kunne ikke lastes. Prøv igjen når filen er tilgjengelig.</p>
  ) : (
    <video
      className="message-video"
      src={assetUrl(src)}
      controls
      playsInline
      preload="metadata"
      onError={() => setFailed(true)}
    />
  );
}

export default function App() {
  const [entered, setEntered] = useState(false),
    [ready, setReady] = useState(false),
    [supported, setSupported] = useState(supportsWebGL);
  const [panel, setPanel] = useState<Panel>(null),
    [room, setRoom] = useState<RoomId>('entrance'),
    [position, setPosition] = useState<[number, number]>([0, 24]);
  const [destination, setDestination] = useState<Destination>({ room: 'entrance', key: 0 });
  const [selected, setSelected] = useState<Photograph | null>(null),
    [target, setTarget] = useState(''),
    [locked, setLocked] = useState(false),
    [quality, setQuality] = useState<Quality>('auto');
  const [tour, setTour] = useState<number | null>(null),
    [notice, setNotice] = useState(''),
    [full, setFull] = useState(false);
  const input = useRef<VisitorInput>({ x: 0, y: 0, dragged: false }),
    sound = useAmbience();
  const currentRoom = rooms.find((r) => r.id === room)!;
  const close = useCallback(() => setPanel(null), []);
  const onReady = useCallback(() => setReady(true), []),
    onFailure = useCallback(() => setSupported(false), []);
  const select = useCallback((photo: Photograph) => {
    setSelected(photo);
    setPanel('photo');
  }, []);
  const navigate = useCallback((id: RoomId) => {
    setDestination((d) => ({ room: id, key: d.key + 1 }));
    setPanel(null);
  }, []);
  const startTour = () => {
    setEntered(true);
    setTour(0);
    navigate('entrance');
  };
  const tourStep = (index: number) => {
    setTour(index);
    navigate(rooms[index].id);
  };
  const open = useCallback((value: Panel) => {
    if (document.pointerLockElement) document.exitPointerLock();
    setPanel(value);
  }, []);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (!entered || panel || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.code === 'KeyM') open('map');
      if (event.code === 'KeyH') open('help');
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [entered, panel, open]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 4500);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    const change = () => setFull(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', change);
    return () => document.removeEventListener('fullscreenchange', change);
  }, []);
  const lock = async () => {
    try {
      const canvas = document.querySelector('canvas');
      if (canvas?.requestPointerLock) await canvas.requestPointerLock();
      else setNotice('Dra i rommet for å se deg rundt.');
    } catch {
      setNotice('Dra i rommet for å se deg rundt.');
    }
  };
  const fullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      setNotice('Fullskjerm er ikke tilgjengelig i denne nettleseren.');
    }
  };
  const iconButton = (name: IconName, label: string, action: () => void, pressed?: boolean) => (
    <button
      className="icon-button"
      aria-label={label}
      title={label}
      onClick={action}
      aria-pressed={pressed}
    >
      <Icon name={name} />
    </button>
  );
  const currentPhotos = photographs.filter((p) => p.room === selected?.room),
    photoIndex = currentPhotos.findIndex((p) => p.id === selected?.id);
  return (
    <main className={entered ? 'app exploring' : 'app welcoming'}>
      <div className="scene" aria-label="Et tredimensjonalt museum i en skog">
        {supported && (
          <SceneBoundary onError={onFailure}>
            <Suspense fallback={null}>
              <Museum
                entered={entered}
                active={entered && !panel}
                input={input}
                destination={destination}
                onRoom={setRoom}
                onPosition={setPosition}
                onSelect={select}
                onTarget={setTarget}
                onLock={setLocked}
                quality={quality}
                onReady={onReady}
                onFailure={onFailure}
              />
            </Suspense>
          </SceneBoundary>
        )}
      </div>
      <div className="scene-vignette" />
      <header className="topbar">
        <button
          className="brand"
          onClick={() => {
            setEntered(false);
            setPanel(null);
            setTour(null);
          }}
          aria-label="Til velkomstsiden"
        >
          <SeahorseMark />
          <span>
            MAMMA<small>ET MUSEUM AV KJÆRLIGHET</small>
          </span>
        </button>
        {!entered ? (
          <div className="top-note">
            <span className="status-dot" /> EN HELT SPESIELL 50-ÅRSDAG
          </div>
        ) : (
          <div className="top-actions">
            {iconButton(
              sound.enabled ? 'sound' : 'muted',
              sound.enabled ? 'Slå av naturlyd' : 'Slå på naturlyd',
              () => void sound.toggle(),
              sound.enabled,
            )}
            {document.fullscreenEnabled &&
              iconButton(
                'expand',
                full ? 'Avslutt fullskjerm' : 'Fullskjerm',
                () => void fullscreen(),
                full,
              )}
            <button className="pill-button" onClick={() => open('menu')}>
              <Icon name="menu" />
              <span>Meny</span>
            </button>
          </div>
        )}
      </header>
      {!entered && (
        <section className="welcome">
          <div className="welcome-copy">
            <div className="eyebrow">
              <span className="fine-line" /> EN UTSTILLING TIL DEG
            </div>
            <h1>
              Et helt liv.
              <br />
              Så mye <em>kjærlighet.</em>
            </h1>
            <p className="welcome-description">
              Et museum gjemt i skogen.
              <br />
              Seks rom. Utallige øyeblikk.
              <br />
              Og én helt enestående mamma.
            </p>
            <div className="welcome-cta">
              <button
                className="primary-button"
                disabled={supported && !ready}
                onClick={() => (supported ? setEntered(true) : open('collection'))}
              >
                {!supported ? 'Se bildene' : ready ? 'Gå inn i museet' : 'Åpner museet …'}
                {ready || !supported ? <Icon name="arrow" /> : <span className="spinner" />}
              </button>
              {supported && (
                <button className="text-button" disabled={!ready} onClick={startTour}>
                  Ta en omvisning <span>↗</span>
                </button>
              )}
            </div>
            <div className="welcome-instructions">
              <Icon name="mouse" size={16} />
              <span className="desktop-copy">WASD for å gå · Dra med musen for å se</span>
              <span className="mobile-copy">Bruk styrespaken · Dra for å se deg rundt</span>
            </div>
          </div>
          <div className="anniversary">
            <span>50</span>
            <div>
              ÅR MED
              <br />
              KJÆRLIGHET
            </div>
          </div>
          <div className="welcome-caption">
            <span>02 / SJØHESTENS SAL</span>
            <p>
              Et stille øyeblikk.
              <br />
              En verden av minner.
            </p>
            <span className="caption-rule" />
          </div>
          <footer className="welcome-footer">
            <span>LAGET MED KJÆRLIGHET, TIL MAMMA</span>
            <span>
              UTFORSK I DITT EGET TEMPO <span className="tiny-arrow">↗</span>
            </span>
          </footer>
        </section>
      )}
      {entered && (
        <>
          <div className="room-indicator" aria-live="polite">
            <span>
              {currentRoom.number} <i>/ 06</i>
            </span>
            <div>
              <h1>{currentRoom.name}</h1>
              <p>{currentRoom.subtitle}</p>
            </div>
          </div>
          {!panel && (
            <>
              <div className="crosshair" aria-hidden="true" />
              {target && (
                <button
                  className="inspect-hint"
                  onClick={() => {
                    const p = photographs.find((p) => p.id === target);
                    if (p) select(p);
                  }}
                >
                  <span className="keycap">E</span> Se «
                  {photographs.find((p) => p.id === target)?.title}»
                </button>
              )}
              <TouchControls input={input} />
            </>
          )}
          <nav className="bottom-bar" aria-label="Museumsnavigasjon">
            <button className="map-button" onClick={() => open('map')}>
              <Icon name="map" />
              <span>Utforsk museet</span>
              <span className="keycap">M</span>
            </button>
            <div className="walking-hint">
              {locked ? (
                <>
                  <span className="keycap">ESC</span> Frigjør musen
                </>
              ) : (
                <button className="text-button" onClick={() => void lock()}>
                  <Icon name="mouse" size={16} /> Fri musebevegelse
                </button>
              )}
              <span className="hint-divider" />W A S D <span className="muted">for å gå</span>
            </div>
            <button
              className="help-button"
              onClick={() => open('help')}
              aria-label="Slik utforsker du museet"
            >
              <Icon name="help" />
              <span>Slik utforsker du</span>
            </button>
          </nav>
          {tour !== null && !panel && (
            <section className="tour-card" aria-label="Omvisning">
              <div className="tour-heading">
                <span className="eyebrow">OMVISNING · {tour + 1} AV 6</span>
                <button
                  className="icon-button"
                  aria-label="Avslutt omvisning"
                  onClick={() => setTour(null)}
                >
                  <Icon name="close" size={16} />
                </button>
              </div>
              <h2>{rooms[tour].name}</h2>
              <p>{rooms[tour].description}</p>
              <div className="tour-actions">
                <button
                  className="text-button"
                  disabled={tour === 0}
                  onClick={() => tourStep(tour - 1)}
                >
                  ← Forrige
                </button>
                <button
                  className="text-button"
                  onClick={() => (tour === 5 ? setTour(null) : tourStep(tour + 1))}
                >
                  {tour === 5 ? 'Utforsk videre' : 'Neste rom'} <Icon name="arrow" size={16} />
                </button>
              </div>
            </section>
          )}
          {room === 'celebration' && museumContent.celebrationVideo && !panel && (
            <button className="video-hotspot pill-button" onClick={() => open('video')}>
              <Icon name="play" /> Se bursdagshilsen
            </button>
          )}
        </>
      )}
      {!supported && entered && (
        <div className="unsupported">
          <h2>Minnene er fortsatt her.</h2>
          <p>
            3D-visningen er ikke tilgjengelig på denne enheten. Du kan fortsatt se alle bildene og
            lese historiene.
          </p>
          <button className="primary-button" onClick={() => open('collection')}>
            Se bildene <Icon name="arrow" />
          </button>
          <button className="text-button" onClick={() => location.reload()}>
            Prøv 3D-visningen igjen
          </button>
        </div>
      )}
      {!supported && !entered && (
        <div className="support-note">
          Denne enheten kan ikke vise 3D. Bildevisningen er tilgjengelig.
        </div>
      )}
      {notice && (
        <div className="toast" role="status">
          {notice}
        </div>
      )}
      {panel && (
        <Dialog
          title={
            panel === 'photo'
              ? (selected?.title ?? 'Fotografi')
              : panel === 'map'
                ? 'Museumskart'
                : panel === 'help'
                  ? 'Slik utforsker du'
                  : panel === 'collection'
                    ? 'Alle bilder'
                    : panel === 'video'
                      ? 'Bursdagshilsen'
                      : 'Museumsmeny'
          }
          onClose={close}
          className={
            panel === 'photo'
              ? 'photo-dialog'
              : panel === 'collection'
                ? 'collection-dialog'
                : panel === 'map'
                  ? 'map-dialog'
                  : ''
          }
        >
          {panel === 'map' && (
            <MuseumMap
              current={room}
              position={position}
              onNavigate={(id) => {
                setTour(null);
                navigate(id);
              }}
            />
          )}
          {panel === 'menu' && (
            <>
              <span className="eyebrow">DITT BESØK</span>
              <h2>Ta deg god tid.</h2>
              <p className="muted">Alle øyeblikkene venter på deg.</p>
              <div className="menu-links">
                <button onClick={() => open('map')}>
                  <Icon name="map" /> Museumskart <span>↗</span>
                </button>
                <button onClick={startTour}>
                  <Icon name="play" /> Start omvisning <span>↗</span>
                </button>
                <button onClick={() => open('collection')}>
                  <Icon name="image" /> Se alle bildene <span>↗</span>
                </button>
                <button
                  onClick={() => {
                    setTour(null);
                    navigate('entrance');
                  }}
                >
                  <Icon name="home" /> Tilbake til inngangen <span>↗</span>
                </button>
                <button onClick={() => open('help')}>
                  <Icon name="help" /> Slik utforsker du <span>↗</span>
                </button>
              </div>
              <div className="setting">
                <label htmlFor="quality">Bildekvalitet</label>
                <select
                  id="quality"
                  value={quality}
                  onChange={(e) => setQuality(e.target.value as Quality)}
                >
                  <option value="auto">Automatisk</option>
                  <option value="high">Høy</option>
                  <option value="low">Lett · for enklere enheter</option>
                </select>
              </div>
              <button className="sound-setting" onClick={() => void sound.toggle()}>
                <Icon name={sound.enabled ? 'sound' : 'muted'} /> Naturlyd{' '}
                <span>{sound.enabled ? 'På' : 'Av'}</span>
              </button>
            </>
          )}
          {panel === 'help' && (
            <>
              <span className="eyebrow">VELKOMMEN INN</span>
              <h2>Finn din egen rytme.</h2>
              <p className="muted">Ingen riktig rekkefølge. Ingen hastverk.</p>
              <div className="instructions-grid">
                <div>
                  <Icon name="mouse" size={26} />
                  <h3>På datamaskin</h3>
                  <p>
                    Gå med <b>W A S D</b> eller piltastene. Hold <b>Shift</b> for å gå raskere. Dra
                    med musen for å se deg rundt.
                  </p>
                  <p>
                    Velg «Fri musebevegelse» for å låse musen. <b>Esc</b> frigjør den igjen.
                  </p>
                </div>
                <div>
                  <Icon name="sun" size={26} />
                  <h3>På mobil og nettbrett</h3>
                  <p>
                    Bruk styrespaken nederst til venstre for å gå. Dra med en finger i rommet for å
                    se deg rundt.
                  </p>
                  <p>Trykk på et bilde for å åpne det.</p>
                </div>
              </div>
              <div className="help-note">
                <p>
                  <b>Kom nærmere minnene.</b> Klikk på bildene, eller se mot et bilde og trykk E.
                  Kartet lar deg gå direkte til et rom. Du kan også se alle bildene fra menyen.
                </p>
              </div>
              <button className="primary-button" onClick={close}>
                Jeg er klar <Icon name="arrow" />
              </button>
            </>
          )}
          {panel === 'photo' && selected && (
            <>
              <div className="photo-stage">
                <SafeImage src={selected.image} alt={selected.title} />
              </div>
              <div className="photo-story">
                <span className="eyebrow">
                  {rooms.find((r) => r.id === selected.room)?.name}
                  {selected.year ? ` · ${selected.year}` : ''}
                </span>
                <h2>{selected.title}</h2>
                {selected.placeholder && (
                  <span className="placeholder-label">
                    Eksempelbilde · plass til ditt eget fotografi
                  </span>
                )}
                <p>{selected.description}</p>
                {selected.video && <VideoMessage key={selected.video} src={selected.video} />}
                <div className="photo-nav">
                  <button
                    className="text-button"
                    disabled={photoIndex <= 0}
                    onClick={() => setSelected(currentPhotos[photoIndex - 1])}
                  >
                    ← Forrige
                  </button>
                  <span>
                    {photoIndex + 1} / {currentPhotos.length}
                  </span>
                  <button
                    className="text-button"
                    disabled={photoIndex >= currentPhotos.length - 1}
                    onClick={() => setSelected(currentPhotos[photoIndex + 1])}
                  >
                    Neste →
                  </button>
                </div>
              </div>
            </>
          )}
          {panel === 'collection' && (
            <>
              <span className="eyebrow">MINNENE VÅRE</span>
              <h2>Et øyeblikk om gangen.</h2>
              <p className="muted">Alle bildene fra museet, samlet på ett sted.</p>
              {rooms
                .filter((r) => photographs.some((p) => p.room === r.id))
                .map((r) => (
                  <section className="collection-room" key={r.id}>
                    <h3>
                      <span>{r.number}</span> {r.name}
                    </h3>
                    <div className="collection-grid">
                      {photographs
                        .filter((p) => p.room === r.id)
                        .map((p) => (
                          <button key={p.id} aria-label={p.title} onClick={() => select(p)}>
                            <SafeImage src={p.image} alt="" />
                            <span>{p.title}</span>
                          </button>
                        ))}
                    </div>
                  </section>
                ))}
            </>
          )}
          {panel === 'video' && (
            <>
              <span className="eyebrow">EN HILSEN TIL DEG</span>
              <h2>Gratulerer med dagen.</h2>
              <VideoMessage src={museumContent.celebrationVideo} />
              <p>{museumContent.mother.ending}</p>
            </>
          )}
        </Dialog>
      )}
    </main>
  );
}
