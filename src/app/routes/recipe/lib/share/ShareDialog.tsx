import { useEffect, useRef, useState } from 'react';
import { cn } from '~app/shared/cn';
import { Button } from '~app/shared/components';
import { hoverField, hoverTint } from '~app/shared/hover';
import { Check, Cross } from '~app/shared/icons';
import { ExpiryPicker } from './ExpiryPicker';
import { useShare } from './useShare';

type Props = {
  slug: string;
  /** The popup was closed (button, Escape or a click outside); the caller stops rendering it. */
  onClose: () => void;
};

const dateFormat = new Intl.DateTimeFormat('nl-NL', { dateStyle: 'long' });

/** Modal popup that opens on mount: the member's share link of the recipe with a button to share or copy it, and its end date. */
export function ShareDialog({ slug, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const share = useShare(slug);
  // Feature detection after mount: the device's own capability, not its user agent.
  const [canShare] = useState(() => typeof navigator.share === 'function');
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!dialog.current?.open) dialog.current?.showModal();
  }, []);

  const url = `${location.origin}/share/${share.token}`;
  const send = () => {
    // A dismissed share sheet rejects; that is not an error, and the link stays in the field.
    navigator.share({ url }).catch(() => {});
  };
  const copy = () => {
    // A refused clipboard leaves the link in the field to select by hand.
    navigator.clipboard.writeText(url).then(
      () => setCopied(true),
      () => {},
    );
  };

  return (
    // Escape and the focus trap come with showModal. The dialog has no padding of its own, so a click whose target is the dialog itself is a click on the backdrop.
    // oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- a mouse shortcut for the backdrop; keyboard users have Escape and the close button
    <dialog
      ref={dialog}
      data-testid="ShareDialog-dialog"
      aria-labelledby="share-title"
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[min(28rem,calc(100vw-2rem))] overflow-y-auto rounded-xl border-3 border-ink bg-white p-0 text-ink shadow-hard backdrop:bg-ink/40"
    >
      <div className="grid gap-5 p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 id="share-title" data-testid="ShareDialog-title" className="text-xl font-black text-balance">
            Recept delen
          </h2>
          <button
            type="button"
            data-testid="ShareDialog-close"
            aria-label="Sluiten"
            onClick={() => dialog.current?.close()}
            className={cn('-m-2 grid size-11 shrink-0 cursor-pointer place-items-center rounded-full', hoverTint)}
          >
            <Cross />
          </button>
        </div>
        {share.state === 'loading' && <p data-testid="ShareDialog-loading">Link maken…</p>}
        {share.state === 'failed' && (
          <p data-testid="ShareDialog-failed" role="alert" className="font-bold text-red">
            De link kon niet worden gemaakt. Probeer het later opnieuw.
          </p>
        )}
        {share.state === 'ready' && (
          <>
            <div className="grid gap-3">
              <input
                readOnly
                data-testid="ShareDialog-link"
                aria-label="Link"
                value={url}
                onFocus={(e) => e.currentTarget.select()}
                className={cn('min-h-11 w-full rounded-[10px] border-3 border-ink bg-white px-3', hoverField)}
              />
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  data-testid="ShareDialog-action"
                  onClick={canShare ? send : copy}
                  className="min-h-11 flex-none px-5 text-base font-extrabold"
                >
                  {canShare ? 'Deel' : 'Kopieer link'}
                </Button>
                {copied && (
                  <output data-testid="ShareDialog-copied" className="font-bold">
                    Gekopieerd
                  </output>
                )}
              </div>
            </div>
            <div className="grid gap-3">
              <p className="flex items-center gap-2 font-extrabold">
                <span data-testid="ShareDialog-expiry">
                  {share.expiresAt ? `Verloopt op ${dateFormat.format(new Date(share.expiresAt))}` : 'Verloopt nooit'}
                </span>
                {share.check !== 'off' && (
                  <Check
                    data-testid="ShareDialog-check"
                    aria-label="Opgeslagen"
                    className={cn('text-jade transition-opacity duration-500 motion-reduce:transition-none', share.check === 'fading' && 'opacity-0')}
                  />
                )}
              </p>
              {share.picking ? (
                <ExpiryPicker value={share.choice} onChoose={(c) => void share.choose(c)} />
              ) : (
                <Button
                  type="button"
                  data-testid="ShareDialog-change"
                  onClick={share.change}
                  className="min-h-11 flex-none self-start px-5 text-base"
                >
                  Wijzig
                </Button>
              )}
              {share.error && (
                <p data-testid="ShareDialog-error" role="alert" className="font-bold text-red">
                  De einddatum kon niet worden opgeslagen.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </dialog>
  );
}
