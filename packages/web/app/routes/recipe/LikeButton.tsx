import { useState } from 'react';
import { cn } from '~/shared/cn';
import { Heart } from '~/shared/icons';
import { press } from '~/shared/press';

type Props = { slug: string; liked: boolean };

/** Heart button in the top row: likes and unlikes the recipe for the member. Changes at once and goes back when the request fails. */
export function LikeButton({ slug, liked: stored }: Props) {
  const [liked, setLiked] = useState(stored);
  const [pending, setPending] = useState(false);

  const toggle = async () => {
    const wanted = !liked;
    setLiked(wanted);
    setPending(true);
    try {
      // States the wanted value instead of toggling, so a retry cannot flip it back.
      const response = await fetch(`/recepten/${slug}/favoriet`, { method: 'POST', body: new URLSearchParams({ liked: String(wanted) }) });
      if (!response.ok) setLiked(!wanted);
    } catch {
      setLiked(!wanted);
    }
    setPending(false);
  };

  return (
    <button
      type="button"
      data-testid="LikeButton-heart"
      aria-pressed={liked}
      aria-label={liked ? 'Verwijder uit favorieten' : 'Markeer als favoriet'}
      disabled={pending}
      onClick={() => void toggle()}
      className={cn(
        'grid size-11 cursor-pointer place-items-center rounded-[10px] border-3 border-ink',
        press,
        liked ? 'bg-red text-white' : 'bg-white text-ink',
      )}
    >
      <Heart className={cn(liked && 'fill-current')} />
    </button>
  );
}
