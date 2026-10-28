import { useId, useState, type ComponentProps, type SubmitEvent } from 'react';
import { cn } from '~app/shared/cn';
import { Button } from '~app/shared/components';
import { readRecipe } from './readRecipe';
import { toDraftSeed } from './toDraftSeed';
import type { DraftSeed } from '../draft';

interface ImportBoxProps extends Omit<ComponentProps<'form'>, 'onSubmit'> {
  /** The starting seed: the imported recipe is laid over it, so the author and tags stay as they were. */
  base: DraftSeed;
  /** The recipe that was found, and the address of its image if it has one. */
  onImported: (seed: DraftSeed, imageUrl: string | undefined) => void;
}

const messages = {
  notAnAddress: 'Vul een webadres in dat met http:// of https:// begint.',
  notFetched: 'De pagina kon niet worden opgehaald. Controleer het adres, of typ het recept zelf in.',
  tooMany: 'Je hebt net veel pagina’s opgehaald. Probeer het over een minuut opnieuw.',
  noRecipe: 'Op deze pagina is geen recept gevonden. Typ het recept zelf in.',
};

/** The address as a web address, or undefined. */
function webAddress(text: string) {
  try {
    const url = new URL(text.trim());
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : undefined;
  } catch {
    return undefined;
  }
}

/** A field for a web address: fetches that page through the Worker, reads its recipe in the browser and hands it over. Shows a message when that fails and can then be tried again. */
export function ImportBox({ base, onImported, className, ...props }: ImportBoxProps) {
  const [address, setAddress] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const id = useId();

  const run = async () => {
    const url = webAddress(address);
    if (!url) return setMessage(messages.notAnAddress);
    setMessage('');
    setBusy(true);
    try {
      const response = await fetch('/importeren/pagina', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      }).catch(() => undefined);
      if (!response?.ok) return setMessage(response?.status === 429 ? messages.tooMany : messages.notFetched);
      const imported = readRecipe(await response.text(), url);
      if (!imported) return setMessage(messages.noRecipe);
      const { seed, imageUrl } = toDraftSeed(imported, url, base);
      setBusy(false);
      onImported(seed, imageUrl);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      {...props}
      onSubmit={(e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!busy) void run();
      }}
      className={cn('grid gap-2', className)}
      noValidate
    >
      <label htmlFor={id} className="font-extrabold">
        Webadres van het recept
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id={id}
          data-testid="ImportBox-address"
          type="url"
          inputMode="url"
          autoComplete="off"
          placeholder="https://"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="block min-h-13 w-full rounded-[0.625rem] border-3 border-ink bg-white px-3 text-lg text-ink focus:shadow-focus focus:outline-transparent"
        />
        <Button type="submit" main disabled={busy} data-testid="ImportBox-button" className="px-5 sm:flex-none">
          {busy ? 'Bezig met ophalen…' : 'Importeren'}
        </Button>
      </div>
      <p data-testid="ImportBox-message" aria-live="polite" className="font-bold text-red empty:hidden">
        {message}
      </p>
    </form>
  );
}
