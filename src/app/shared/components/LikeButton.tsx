import { useState, type ComponentProps } from 'react';
import { cn } from '../cn';
import { MapleLeaf } from '../icons';
import { press } from '../press';

interface LikeButtonProps extends ComponentProps<'button'> {
  slug: string;
  initialLiked: boolean;
  /** Called after the server accepted the change. */
  onSaved?: () => void;
}

/** MapleLeaf button (recipe page, recipe card): likes and unlikes the recipe for the member. Changes at once and goes back when the request fails. */
export function LikeButton({ slug, initialLiked, onSaved, className, ...props }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [pending, setPending] = useState(false);

  const toggle = async () => {
    if (pending) return;
    const wanted = !liked;
    setLiked(wanted);
    setPending(true);
    try {
      // States the wanted value instead of toggling, so a retry cannot flip it back.
      const response = await fetch(`/recepten/${slug}/favoriet`, { method: 'POST', body: new URLSearchParams({ liked: String(wanted) }) });
      if (response.ok) onSaved?.();
      else setLiked(!wanted);
    } catch {
      setLiked(!wanted);
    }
    setPending(false);
  };

  return (
    <button
      {...props}
      type="button"
      data-testid="LikeButton-leaf"
      aria-pressed={liked}
      aria-label={liked ? 'Verwijder uit favorieten' : 'Markeer als favoriet'}
      aria-disabled={pending}
      onClick={() => void toggle()}
      className={cn(
        'grid size-11 cursor-pointer place-items-center rounded-[10px] border-3 border-ink',
        press,
        liked ? 'bg-red text-white hover:bg-[color-mix(in_srgb,var(--color-red),var(--color-ink)_25%)]' : 'bg-white text-ink hover:bg-yel',
        className,
      )}
    >
      <MapleLeaf className={cn('size-7', liked && 'fill-current')} />
    </button>
  );
}
