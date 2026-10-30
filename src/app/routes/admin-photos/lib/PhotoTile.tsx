import { Link } from 'react-router';
import { cn } from '~app/shared/cn';
import { hoverRecolor, hoverTint } from '~app/shared/hover';
import { Book, Check, Recent } from '~app/shared/icons';
import { formatDate, formatSize } from './format';
import type { StoredPhotoInfo } from './photos';

interface PhotoTileProps {
  photo: StoredPhotoInfo;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const tile = 'relative block overflow-clip rounded-[0.625rem] border-3 border-ink bg-white shadow-hard-xs';

/** One stored photo: its thumbnail, date and size. A photo that a recipe uses is locked, with a book that links to the recipe; any other is a checkbox, with a clock when it is under a day old. */
export function PhotoTile({ photo, checked, onChange }: PhotoTileProps) {
  const { name, size, uploaded, recent, recipe } = photo;
  const image = (
    <img
      src={`/foto/${name}`}
      alt=""
      loading="lazy"
      className={cn('block aspect-square w-full border-b-2 border-ink bg-ink/8 object-cover', recipe && 'border-ink/40', checked && 'border-blu')}
    />
  );
  const mark = recipe ? (
    <Link
      to={`/recepten/${recipe.slug}`}
      target="_blank"
      rel="noopener"
      title="Open het recept"
      data-testid="PhotoTile-recipe"
      className={cn('col-2 row-span-2 row-start-1 -mr-1.5 -my-2  grid place-items-center p-2 text-ink/45', hoverRecolor)}
    >
      <Book />
      <span className="sr-only">Open het recept dat deze foto gebruikt</span>
    </Link>
  ) : recent ? (
    <span title="Minder dan een dag oud" data-testid="PhotoTile-recent" className="col-2 row-span-2 row-start-1 grid place-items-center text-yel">
      <Recent />
      <span className="sr-only">Minder dan een dag oud</span>
    </span>
  ) : null;
  const meta = (
    <span className="grid grid-cols-[minmax(0,1fr)_auto] items-end px-2.5 py-2  text-[0.9375rem] tabular-nums">
      <time data-testid="PhotoTile-date" dateTime={uploaded.toISOString().slice(0, 10)} className="col-1 font-black">
        {formatDate(uploaded)}
      </time>
      <span data-testid="PhotoTile-size" className="col-1 font-extrabold text-muted">
        {formatSize(size)}
      </span>
      {mark}
    </span>
  );

  if (recipe)
    return (
      <li data-testid="PhotoTile-tile">
        <div className={cn(tile, 'border-ink/40 shadow-none')}>
          {image}
          {meta}
        </div>
      </li>
    );
  return (
    <li data-testid="PhotoTile-tile">
      <label
        className={cn(
          tile,
          'cursor-pointer',
          hoverTint,
          'has-focus-visible:outline-4 has-focus-visible:outline-offset-2 has-focus-visible:outline-blu',
          'has-checked:border-blu has-checked:bg-blu/10 has-checked:shadow-[0_0_0_2px_var(--color-blu)] has-checked:hover:not-disabled:bg-blu/10',
        )}
      >
        {image}
        <input
          type="checkbox"
          data-testid="PhotoTile-check"
          value={name}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-label={`Foto van ${formatDate(uploaded)}, ${formatSize(size)}`}
          className="peer absolute top-2 left-2 size-8 opacity-0"
        />
        <span
          aria-hidden="true"
          className="absolute top-2 left-2 grid size-8 place-items-center rounded-[0.45rem] border-3 border-ink bg-white text-transparent shadow-hard-xs peer-checked:bg-blu peer-checked:text-white"
        >
          <Check />
        </span>
        {meta}
      </label>
    </li>
  );
}
