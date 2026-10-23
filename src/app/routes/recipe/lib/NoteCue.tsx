import { cn } from '~app/shared/cn';
import { Check } from '~app/shared/icons';
import type { Cue } from './useNote';

type Props = { cue: Cue; onClear: () => void; onEnd: () => void; className?: string };

/** "Notitie bewaard": announced when it appears, fades by itself, and a tap removes it at once. The live region stays in the page so the appearance is announced. */
export function NoteCue({ cue, onClear, onEnd, className }: Props) {
  return (
    <output data-testid="NoteCue-status" className="block">
      {cue !== 'off' && (
        <button
          type="button"
          data-testid="NoteCue-cue"
          onClick={onClear}
          onAnimationEnd={onEnd}
          className={cn(
            'inline-flex min-h-11 cursor-pointer items-center gap-1.5 font-black',
            cue === 'fading' && 'animate-fade motion-reduce:animate-none',
            className,
          )}
        >
          <Check className="size-4.5" /> Notitie bewaard
        </button>
      )}
    </output>
  );
}
