import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Button, Seal, TileBand } from '~app/shared/components';
import { Camera, Trash } from '~app/shared/icons';
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
  /** Seal stamped on the photo, as on the recipe page. */
  seal?: string;
};

type Pending = { blob: Blob; preview: string };

const wide = 'inline-flex items-center justify-center gap-2 px-4';

/** The recipe's photo: choose from camera or gallery, shrink and upload, show in the frame the recipe page uses, replace or remove. */
export function PhotoField({ value, onChange, onStateChange, tile, seal }: Props) {
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
            <Camera />
            Foto toevoegen
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
          <>
            <div className="mb-2 flex gap-2">
              <Button type="button" onClick={pick} className={wide}>
                <Camera />
                Andere foto
              </Button>
              <Button type="button" onClick={remove} aria-label="Foto verwijderen" className="flex-none px-3 text-muted">
                <Trash />
              </Button>
            </div>
            <div className="@container overflow-hidden rounded-xl border-3 border-ink bg-white shadow-hard-sm">
              <div className="relative">
                <img
                  src={src}
                  alt="Foto van het recept"
                  onError={() => setFailedSrc(src)}
                  className="block aspect-2/1 w-full border-b-3 border-ink object-cover"
                />
                {seal && <Seal id={seal} className="h-13" />}
              </div>
              <TileBand first={tile} responsive className="border-b-0" />
            </div>
          </>
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
