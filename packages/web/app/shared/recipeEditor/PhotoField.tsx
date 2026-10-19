import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Button } from '~/shared/Button';
import { TileBand } from '~/shared/TileBand';
import { resizePhoto, uploadPhoto } from './photoFile';

/** Whether the photo is settled, or still going up / failed to go up (then the recipe can't be saved). */
export type PhotoState = 'ready' | 'uploading' | 'error';

type Props = {
  /** The recipe's photo: an uploaded path, an older link or empty. Posted as the form field `image`. */
  value: string;
  onChange: (path: string) => void;
  onStateChange: (state: PhotoState) => void;
  /** Index of the tile band beneath the photo. */
  tile: number;
};

type Pending = { blob: Blob; preview: string };

const icon = { viewBox: '0 0 24 24', 'aria-hidden': true, className: 'size-5 shrink-0 fill-none stroke-current stroke-2 [stroke-linejoin:round]' };
const camera = (
  <svg {...icon}>
    <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
    <circle cx="12" cy="13" r="3.5" />
  </svg>
);
const trash = (
  <svg {...icon}>
    <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
  </svg>
);
const wide = 'inline-flex items-center justify-center gap-2 px-4';

/** The recipe's photo: choose from camera or gallery, shrink and upload, show in the frame the recipe page uses, replace or remove. */
export function PhotoField({ value, onChange, onStateChange, tile }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Pending>();
  const [state, setState] = useState<PhotoState>('ready');
  const [unreadable, setUnreadable] = useState(false);
  const [failedSrc, setFailedSrc] = useState<string>();
  const upload = useRef<AbortController>(undefined);

  const changeState = (next: PhotoState) => {
    setState(next);
    onStateChange(next);
  };
  // Leaving the page or resetting the editor unmounts this field: stop the upload and free the preview.
  useEffect(() => () => upload.current?.abort(), []);
  useEffect(() => () => pending && URL.revokeObjectURL(pending.preview), [pending]);

  const send = async (photo: Pending) => {
    upload.current?.abort();
    const controller = new AbortController();
    upload.current = controller;
    changeState('uploading');
    try {
      const path = await uploadPhoto(photo.blob, controller.signal);
      onChange(path);
      setPending(undefined);
      changeState('ready');
    } catch {
      if (!controller.signal.aborted) changeState('error');
    }
  };

  const choose = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // so choosing the same file again still fires
    if (!file) return;
    setUnreadable(false);
    let blob: Blob;
    try {
      blob = await resizePhoto(file);
    } catch {
      setUnreadable(true);
      return;
    }
    const photo = { blob, preview: URL.createObjectURL(blob) };
    setPending(photo);
    void send(photo);
  };

  const remove = () => {
    upload.current?.abort();
    setPending(undefined);
    setUnreadable(false);
    changeState('ready');
    onChange('');
  };

  const src = pending?.preview ?? value;
  const pick = () => input.current?.click();

  return (
    <div>
      <span className="font-extrabold">Foto</span>
      <input ref={input} type="file" accept="image/*" hidden tabIndex={-1} onChange={choose} />
      <input type="hidden" name="image" value={value} />
      <div className="mt-1">
        {!src ? (
          <Button type="button" onClick={pick} className={`${wide} w-full`}>
            {camera}Foto toevoegen
          </Button>
        ) : failedSrc === src ? (
          <div className="grid gap-2">
            <p role="alert" className="font-bold text-red">
              De foto kan niet worden getoond.
            </p>
            <div className="flex gap-2">
              <Button type="button" onClick={pick}>
                Andere foto
              </Button>
              <Button type="button" onClick={remove}>
                Verwijder
              </Button>
            </div>
          </div>
        ) : (
          <div className="@container overflow-hidden rounded-xl border-3 border-ink bg-white shadow-hard-sm">
            <div className="relative">
              <img
                src={src}
                alt="Foto van het recept"
                onError={() => setFailedSrc(src)}
                className="block aspect-2/1 w-full border-b-3 border-ink object-cover"
              />
              <div className="absolute inset-x-2.5 bottom-3.5 flex gap-2">
                <Button type="button" onClick={pick} className={wide}>
                  {camera}Andere foto
                </Button>
                <Button type="button" onClick={remove} aria-label="Foto verwijderen" className="flex-none px-3 text-muted">
                  {trash}
                </Button>
              </div>
            </div>
            <TileBand first={tile} responsive className="border-b-0" />
          </div>
        )}
      </div>
      <div aria-live="polite">
        {state === 'uploading' && <p className="mt-2 font-bold">Foto wordt geüpload…</p>}
        {state === 'error' && pending && (
          <p className="mt-2 font-bold text-red">
            De foto kon niet worden geüpload.{' '}
            <button type="button" onClick={() => void send(pending)} className="min-h-11 cursor-pointer font-black underline">
              Opnieuw proberen
            </button>
          </p>
        )}
        {unreadable && <p className="mt-2 font-bold text-red">Deze foto kan niet worden gelezen.</p>}
      </div>
      <p className="mt-2 text-sm text-muted">Wordt automatisch verkleind. Op je telefoon kies je uit camera of galerij.</p>
    </div>
  );
}
