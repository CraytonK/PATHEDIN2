import { useEffect, useRef, useState, type ChangeEvent, type CSSProperties, type FormEvent, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { ME, people } from '../data/people';
import type { Banner, BannerPreset } from '../data/types';
import { PhotoError, prepareBannerPhoto } from '../lib/image';
import { useApp, type ProfileEdits } from '../lib/store';
import { useUI } from '../lib/ui';
import { BannerArt, bannerPresets, defaultBanner } from './Banner';
import { Sheet } from './chrome';
import { IconCheck, IconImage, IconUpload } from './icons';
import { Button } from './ui';
import './edit-profile.css';

type Photo = Extract<Banner, { kind: 'photo' }>;
type Fields = { name: string; headline: string; pronouns: string; location: string; bio: string };

const clamp = (v: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, v));

/*
  Edit profile, as on LinkedIn: the banner behind your photo first, then how you introduce yourself.
  Nothing changes until you save; Cancel leaves everything as it was.
*/
export function EditProfileLayer() {
  const at = useUI((s) => s.editProfile);
  const close = useUI((s) => s.closeEditProfile);
  const toast = useUI((s) => s.showToast);
  const savedBanner = useApp((s) => s.banner);
  const saveProfile = useApp((s) => s.saveProfile);
  const [banner, setBanner] = useState<Banner>(defaultBanner);
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [lastPreset, setLastPreset] = useState<BannerPreset>('silk');
  const [fields, setFields] = useState<Fields>({ name: '', headline: '', pronouns: '', location: '', bio: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const upload = useRef<HTMLInputElement>(null);

  // Each time it opens, start from what's saved.
  useEffect(() => {
    if (!at) return;
    const you = people[ME];
    const b = savedBanner ?? defaultBanner;
    setBanner(b);
    setPhoto(b.kind === 'photo' ? b : null);
    setLastPreset(b.kind === 'preset' ? b.id : 'silk');
    setFields({ name: you.name, headline: you.headline, pronouns: you.pronouns ?? '', location: you.location, bio: you.bio });
    setError('');
    setNote('');
    if (at === 'banner') {
      const t = setTimeout(() => upload.current?.focus(), 380);
      return () => clearTimeout(t);
    }
  }, [at, savedBanner]);

  const set = (k: keyof Fields) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFields((f) => ({ ...f, [k]: e.target.value }));

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setNote('');
    setBusy(true);
    try {
      const p = await prepareBannerPhoto(file);
      const next: Photo = { kind: 'photo', src: p.src, w: p.w, h: p.h, x: 50, y: 50, zoom: 1 };
      setPhoto(next);
      setBanner(next);
      if (p.small) setNote('This photo is on the small side, so it may look soft across a wide screen.');
    } catch (err) {
      setError(err instanceof PhotoError ? err.message : 'That photo couldn’t be used. Try another.');
    } finally {
      setBusy(false);
    }
  };

  const framePhoto = (next: Photo) => {
    setPhoto(next);
    setBanner(next);
  };

  const removePhoto = () => {
    setPhoto(null);
    setBanner({ kind: 'preset', id: lastPreset });
    setNote('');
  };

  const missing = (['name', 'headline', 'location'] as const).filter((k) => !fields[k].trim());

  const save = (e: FormEvent) => {
    e.preventDefault();
    if (missing.length) return;
    const edits: ProfileEdits = {
      name: fields.name.trim(),
      headline: fields.headline.trim(),
      pronouns: fields.pronouns.trim(),
      location: fields.location.trim(),
      bio: fields.bio.trim(),
    };
    saveProfile(edits, banner);
    close();
    toast('Profile saved');
  };

  return (
    <Sheet open={!!at} onClose={close} title="Edit profile" width={640} label="Edit profile">
      <form className="ep" onSubmit={save} noValidate>
        <section className="ep__section" aria-labelledby="ep-banner-h">
          <h3 id="ep-banner-h" className="ep__h">
            Banner
          </h3>
          <p className="ep__sub">The background behind your photo, on your profile and your Home card.</p>

          <BannerFrame banner={banner} onFrame={framePhoto} photo={people[ME].photo} />

          <div className="ep__banner-bar">
            <label className={`ep__upload ${busy ? 'is-busy' : ''}`}>
              <input ref={upload} type="file" accept="image/*" className="visually-hidden" onChange={onFile} disabled={busy} />
              <IconUpload size={17} strokeWidth={1.8} />
              {busy ? 'Preparing…' : photo ? 'Replace photo' : 'Upload a photo'}
            </label>
            {banner.kind === 'photo' && (
              <label className="ep__zoom">
                <span>Zoom</span>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.01}
                  value={banner.zoom}
                  onChange={(e) => framePhoto({ ...banner, zoom: +e.target.value })}
                  style={{ '--p': `${((banner.zoom - 1) / 2) * 100}%` } as CSSProperties}
                />
              </label>
            )}
            {photo && (
              <button type="button" className="ep__remove" onClick={removePhoto}>
                Remove photo
              </button>
            )}
          </div>
          {banner.kind === 'photo' && <p className="ep__hint">Drag the photo to choose what shows, or use the arrow keys.</p>}
          {error && (
            <p className="ep__error" role="alert">
              {error}
            </p>
          )}
          {note && <p className="ep__hint">{note}</p>}

          <fieldset className="ep__presets">
            <legend className="ep__label">Or one of PathedIn’s</legend>
            <div className="ep__swatches">
              {photo && (
                <Swatch label="Your photo" on={banner.kind === 'photo'} onPick={() => setBanner(photo)}>
                  <BannerArt banner={photo} />
                </Swatch>
              )}
              {bannerPresets.map((p) => (
                <Swatch
                  key={p.id}
                  label={p.label}
                  on={banner.kind === 'preset' && banner.id === p.id}
                  onPick={() => {
                    setBanner({ kind: 'preset', id: p.id });
                    setLastPreset(p.id);
                  }}
                >
                  <BannerArt banner={{ kind: 'preset', id: p.id }} still />
                </Swatch>
              ))}
            </div>
          </fieldset>
          <p className="ep__fine">
            <IconImage size={15} strokeWidth={1.8} /> Wide photos work best, at least 1500 × 500. In this prototype your banner stays on this device.
          </p>
        </section>

        <section className="ep__section" aria-labelledby="ep-intro-h">
          <h3 id="ep-intro-h" className="ep__h">
            Intro
          </h3>
          <label className="ep__field">
            <span>Name</span>
            <input value={fields.name} onChange={set('name')} autoComplete="name" required aria-invalid={!fields.name.trim()} />
          </label>
          <label className="ep__field">
            <span>
              Headline <span className="ep__count">{fields.headline.length}/120</span>
            </span>
            <input value={fields.headline} onChange={set('headline')} maxLength={120} required aria-invalid={!fields.headline.trim()} />
          </label>
          <div className="ep__pair">
            <label className="ep__field">
              <span>Pronouns</span>
              <input value={fields.pronouns} onChange={set('pronouns')} placeholder="she/her, he/him, they/them" />
            </label>
            <label className="ep__field">
              <span>Location</span>
              <input value={fields.location} onChange={set('location')} autoComplete="address-level2" required aria-invalid={!fields.location.trim()} />
            </label>
          </div>
          <label className="ep__field">
            <span>
              About <span className="ep__count">{fields.bio.length}/300</span>
            </span>
            <textarea value={fields.bio} onChange={set('bio')} rows={4} maxLength={300} />
          </label>
        </section>

        <div className="ep__foot">
          {missing.length > 0 && <p className="ep__missing">Add your {missing.join(', ').replace(/, ([^,]*)$/, ' and $1')} to save.</p>}
          <Button type="button" variant="plain" size="medium" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" variant="filled" size="medium" disabled={missing.length > 0}>
            Save
          </Button>
        </div>
      </form>
    </Sheet>
  );
}

/** The banner as it will look, with your photo over its corner. A photo can be dragged to frame it. */
function BannerFrame({ banner, onFrame, photo }: { banner: Banner; onFrame: (b: Photo) => void; photo: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; bx: number; by: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const isPhoto = banner.kind === 'photo';

  // How far the photo overflows the frame, in pixels, so a drag moves it under the pointer.
  // An axis with nothing to show beyond the frame doesn't move at all.
  const overflow = () => {
    const el = ref.current;
    if (!el || banner.kind !== 'photo') return { ox: 0, oy: 0 };
    const W = el.clientWidth;
    const H = el.clientHeight;
    const cover = Math.max(W / banner.w, H / banner.h) * banner.zoom;
    return { ox: banner.w * cover - W, oy: banner.h * cover - H };
  };

  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (banner.kind !== 'photo') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, bx: banner.x, by: banner.y };
    setDragging(true);
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current || banner.kind !== 'photo') return;
    const { ox, oy } = overflow();
    onFrame({
      ...banner,
      x: ox > 1 ? clamp(drag.current.bx - ((e.clientX - drag.current.x) / ox) * 100) : banner.x,
      y: oy > 1 ? clamp(drag.current.by - ((e.clientY - drag.current.y) / oy) * 100) : banner.y,
    });
  };
  const up = () => {
    drag.current = null;
    setDragging(false);
  };
  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    if (banner.kind !== 'photo') return;
    const step = e.shiftKey ? 10 : 2;
    const moves: Record<string, [number, number]> = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    if (moves[e.key]) {
      e.preventDefault();
      onFrame({ ...banner, x: clamp(banner.x + moves[e.key][0]), y: clamp(banner.y + moves[e.key][1]) });
    } else if (e.key === '+' || e.key === '=' || e.key === '-') {
      e.preventDefault();
      onFrame({ ...banner, zoom: clamp(banner.zoom + (e.key === '-' ? -0.1 : 0.1), 1, 3) });
    }
  };

  return (
    <div className="ep__preview">
      <div
        ref={ref}
        className={`ep__frame ${isPhoto ? 'is-photo' : ''} ${dragging ? 'is-dragging' : ''}`}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onKeyDown={key}
        tabIndex={isPhoto ? 0 : -1}
        role={isPhoto ? 'group' : undefined}
        aria-label={isPhoto ? 'Your banner photo. Drag to move it, or use the arrow keys; plus and minus zoom.' : undefined}
      >
        <BannerArt banner={banner} />
      </div>
      <img className="ep__you" src={photo} alt="" />
    </div>
  );
}

function Swatch({ label, on, onPick, children }: { label: string; on: boolean; onPick: () => void; children: ReactNode }) {
  return (
    <button type="button" className={`ep__swatch ${on ? 'is-on' : ''}`} aria-pressed={on} onClick={onPick}>
      <span className="ep__swatch-art">
        {children}
        {on && (
          <span className="ep__swatch-check" aria-hidden="true">
            <IconCheck size={13} strokeWidth={2.6} />
          </span>
        )}
      </span>
      <span className="ep__swatch-label">{label}</span>
    </button>
  );
}
