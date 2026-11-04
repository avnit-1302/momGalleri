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
      <p>This photograph is not available yet.</p>
    </div>
  ) : (
    <img src={assetUrl(src)} alt={alt} className={className} onError={() => setFailed(true)} />
  );
}
function VideoMessage({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <p className="muted">
      The video could not be loaded. Please try again when the file is available.
    </p>
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
      else setNotice('Drag in the room to look around.');
    } catch {
      setNotice('Drag in the room to look around.');
    }
  };
  const fullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      setNotice('Full screen is not available in this browser.');
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
      <div className="scene" aria-label="A three-dimensional memorial museum in a forest">
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
          aria-label="Return to the welcome screen"
        >
          <SeahorseMark />
          <span>
            {museumContent.mother.name}
            <small>A MUSEUM OF REMEMBRANCE</small>
          </span>
        </button>
        {!entered ? (
          <div className="top-note">
            <span className="status-dot" /> ON WHAT WOULD HAVE BEEN HER 50TH BIRTHDAY
          </div>
        ) : (
          <div className="top-actions">
            {iconButton(
              sound.enabled ? 'sound' : 'muted',
              sound.enabled ? 'Turn off nature sounds' : 'Turn on nature sounds',
              () => void sound.toggle(),
              sound.enabled,
            )}
            {document.fullscreenEnabled &&
              iconButton(
                'expand',
                full ? 'Exit full screen' : 'Full screen',
                () => void fullscreen(),
                full,
              )}
            <button className="pill-button" onClick={() => open('menu')}>
              <Icon name="menu" />
              <span>Menu</span>
            </button>
          </div>
        )}
      </header>
      {!entered && (
        <section className="welcome">
          <div className="welcome-copy">
            <div className="eyebrow">
              <span className="fine-line" /> IN LOVING MEMORY
            </div>
            <h1>
              A life remembered.
              <br />A love that <em>stays.</em>
            </h1>
            <p className="welcome-description">
              A quiet place to remember Puja Anand.
              <br />
              Six rooms of love and treasured memories.
              <br />
              On what would have been her 50th birthday.
            </p>
            <div className="welcome-cta">
              <button
                className="primary-button"
                disabled={supported && !ready}
                onClick={() => (supported ? setEntered(true) : open('collection'))}
              >
                {!supported
                  ? 'View photographs'
                  : ready
                    ? 'Enter the museum'
                    : 'Opening the museum …'}
                {ready || !supported ? <Icon name="arrow" /> : <span className="spinner" />}
              </button>
              {supported && (
                <button className="text-button" disabled={!ready} onClick={startTour}>
                  Take a guided tour <span>↗</span>
                </button>
              )}
            </div>
            <div className="welcome-instructions">
              <Icon name="mouse" size={16} />
              <span className="desktop-copy">WASD to walk · Drag the mouse to look around</span>
              <span className="mobile-copy">Use the joystick · Drag to look around</span>
            </div>
          </div>
          <div className="anniversary">
            <span>{museumContent.mother.commemorativeBirthday}</span>
            <div>
              IN LOVING
              <br />
              MEMORY
            </div>
          </div>
          <div className="welcome-caption">
            <span>02 / THE SEAHORSE HALL</span>
            <p>
              A quiet moment.
              <br />A world of memories.
            </p>
            <span className="caption-rule" />
          </div>
          <footer className="welcome-footer">
            <span>IN LOVING MEMORY OF PUJA ANAND</span>
            <span>
              EXPLORE AT YOUR OWN PACE <span className="tiny-arrow">↗</span>
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
                  <span className="keycap">E</span> View “
                  {photographs.find((p) => p.id === target)?.title}”
                </button>
              )}
              <TouchControls input={input} />
            </>
          )}
          <nav className="bottom-bar" aria-label="Museum navigation">
            <button className="map-button" onClick={() => open('map')}>
              <Icon name="map" />
              <span>Explore the museum</span>
              <span className="keycap">M</span>
            </button>
            <div className="walking-hint">
              {locked ? (
                <>
                  <span className="keycap">ESC</span> Release the mouse
                </>
              ) : (
                <button className="text-button" onClick={() => void lock()}>
                  <Icon name="mouse" size={16} /> Free mouse look
                </button>
              )}
              <span className="hint-divider" />W A S D <span className="muted">to walk</span>
            </div>
            <button
              className="help-button"
              onClick={() => open('help')}
              aria-label="How to explore the museum"
            >
              <Icon name="help" />
              <span>How to explore</span>
            </button>
          </nav>
          {tour !== null && !panel && (
            <section className="tour-card" aria-label="Guided tour">
              <div className="tour-heading">
                <span className="eyebrow">GUIDED TOUR · {tour + 1} OF 6</span>
                <button
                  className="icon-button"
                  aria-label="End the guided tour"
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
                  ← Previous
                </button>
                <button
                  className="text-button"
                  onClick={() => (tour === 5 ? setTour(null) : tourStep(tour + 1))}
                >
                  {tour === 5 ? 'Keep exploring' : 'Next room'} <Icon name="arrow" size={16} />
                </button>
              </div>
            </section>
          )}
          {room === 'celebration' && museumContent.celebrationVideo && !panel && (
            <button className="video-hotspot pill-button" onClick={() => open('video')}>
              <Icon name="play" /> Watch shared memories
            </button>
          )}
        </>
      )}
      {!supported && entered && (
        <div className="unsupported">
          <h2>The memories are still here.</h2>
          <p>
            The 3D experience is not available on this device. You can still view all the
            photographs and read their stories.
          </p>
          <button className="primary-button" onClick={() => open('collection')}>
            View photographs <Icon name="arrow" />
          </button>
          <button className="text-button" onClick={() => location.reload()}>
            Try the 3D experience again
          </button>
        </div>
      )}
      {!supported && !entered && (
        <div className="support-note">
          This device cannot display 3D. You can still view the photographs.
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
              ? (selected?.title ?? 'Photograph')
              : panel === 'map'
                ? 'Museum map'
                : panel === 'help'
                  ? 'How to explore'
                  : panel === 'collection'
                    ? 'All photographs'
                    : panel === 'video'
                      ? 'Memories of Puja Anand'
                      : 'Museum menu'
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
              <span className="eyebrow">YOUR VISIT</span>
              <h2>Take your time.</h2>
              <p className="muted">A space to remember, at your own pace.</p>
              <div className="menu-links">
                <button onClick={() => open('map')}>
                  <Icon name="map" /> Museum map <span>↗</span>
                </button>
                <button onClick={startTour}>
                  <Icon name="play" /> Start a guided tour <span>↗</span>
                </button>
                <button onClick={() => open('collection')}>
                  <Icon name="image" /> View all photographs <span>↗</span>
                </button>
                <button
                  onClick={() => {
                    setTour(null);
                    navigate('entrance');
                  }}
                >
                  <Icon name="home" /> Return to the entrance <span>↗</span>
                </button>
                <button onClick={() => open('help')}>
                  <Icon name="help" /> How to explore <span>↗</span>
                </button>
              </div>
              <div className="setting">
                <label htmlFor="quality">Visual quality</label>
                <select
                  id="quality"
                  value={quality}
                  onChange={(e) => setQuality(e.target.value as Quality)}
                >
                  <option value="auto">Automatic</option>
                  <option value="high">High</option>
                  <option value="low">Low · for less powerful devices</option>
                </select>
              </div>
              <button className="sound-setting" onClick={() => void sound.toggle()}>
                <Icon name={sound.enabled ? 'sound' : 'muted'} /> Nature sounds{' '}
                <span>{sound.enabled ? 'On' : 'Off'}</span>
              </button>
            </>
          )}
          {panel === 'help' && (
            <>
              <span className="eyebrow">WELCOME</span>
              <h2>Find your own pace.</h2>
              <p className="muted">No set route. No need to hurry.</p>
              <div className="instructions-grid">
                <div>
                  <Icon name="mouse" size={26} />
                  <h3>On a computer</h3>
                  <p>
                    Walk with <b>W A S D</b> or the arrow keys. Hold <b>Shift</b> to walk faster.
                    Drag the mouse to look around.
                  </p>
                  <p>
                    Choose “Free mouse look” to lock the pointer. Press <b>Esc</b> to release it.
                  </p>
                </div>
                <div>
                  <Icon name="sun" size={26} />
                  <h3>On a phone or tablet</h3>
                  <p>
                    Use the joystick in the bottom left to walk. Drag a finger across the room to
                    look around.
                  </p>
                  <p>Tap a photograph to open it.</p>
                </div>
              </div>
              <div className="help-note">
                <p>
                  <b>Take a closer look.</b> Click a photograph, or look towards it and press E. The
                  map takes you directly to any room. You can also view all photographs from the
                  menu.
                </p>
              </div>
              <button className="primary-button" onClick={close}>
                Start exploring <Icon name="arrow" />
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
                  <span className="placeholder-label">Placeholder · add your own photograph</span>
                )}
                <p>{selected.description}</p>
                {selected.video && <VideoMessage key={selected.video} src={selected.video} />}
                <div className="photo-nav">
                  <button
                    className="text-button"
                    disabled={photoIndex <= 0}
                    onClick={() => setSelected(currentPhotos[photoIndex - 1])}
                  >
                    ← Previous
                  </button>
                  <span>
                    {photoIndex + 1} / {currentPhotos.length}
                  </span>
                  <button
                    className="text-button"
                    disabled={photoIndex >= currentPhotos.length - 1}
                    onClick={() => setSelected(currentPhotos[photoIndex + 1])}
                  >
                    Next →
                  </button>
                </div>
              </div>
            </>
          )}
          {panel === 'collection' && (
            <>
              <span className="eyebrow">OUR MEMORIES</span>
              <h2>One moment at a time.</h2>
              <p className="muted">All the photographs from the museum, together in one place.</p>
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
              <span className="eyebrow">SHARED MEMORIES</span>
              <h2>Remembering Puja Anand.</h2>
              <VideoMessage src={museumContent.celebrationVideo} />
              <p>{museumContent.mother.ending}</p>
            </>
          )}
        </Dialog>
      )}
    </main>
  );
}
