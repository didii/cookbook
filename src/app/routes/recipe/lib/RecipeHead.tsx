import { Seal, TileBand } from '~app/shared/components';
import { hoverRecolor } from '~app/shared/hover';
import type { Recipe } from '~app/shared/recipe';
import { sourceLink } from './sourceLink';

type Props = { recipe: Pick<Recipe, 'title' | 'author' | 'time' | 'servings' | 'source' | 'intro' | 'image' | 'seal'>; tile: number };

/** The top of a recipe page: title, author, time, servings, source, intro and the photo frame. */
export function RecipeHead({ recipe: r, tile }: Props) {
  return (
    <>
      <h1 data-testid="RecipeHead-title" className="text-[clamp(2rem,6vw,3.5rem)] leading-[1.05] font-black tracking-[-0.03em] text-balance">
        {r.title}
      </h1>
      <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 font-extrabold">
        <span data-testid="RecipeHead-author" className="rounded-full border-3 border-ink bg-yel px-3.5 py-0.5">
          van {r.author}
        </span>
        {r.time && <span data-testid="RecipeHead-time">{r.time}</span>}
        {r.servings && <span data-testid="RecipeHead-servings">{r.servings} porties</span>}
        {r.source && <Source source={r.source} />}
      </p>
      <p className="mt-2 max-w-[60ch] text-lg text-muted">{r.intro}</p>

      <div data-testid="RecipeHead-frame" className="@container relative mt-6 overflow-hidden rounded-xl border-3 border-ink bg-white shadow-hard">
        {r.image && (
          <img
            data-testid="RecipeHead-image"
            src={r.image}
            alt=""
            width="1280"
            height="640"
            className="block aspect-2/1 w-full border-b-3 border-ink object-cover"
          />
        )}
        {r.image && r.seal && <Seal sealId={r.seal} className="h-16" />}
        <TileBand first={tile} rows={r.image ? 1 : 3} responsive className="border-b-0" />
      </div>
    </>
  );
}

type SourceProps = { source: string };

/** Where the recipe came from: a link to the address when the source is a web address, otherwise the text. */
function Source({ source }: SourceProps) {
  const link = sourceLink(source);
  return link ? (
    <a data-testid="RecipeHead-source" href={link.href} target="_blank" rel="noopener noreferrer" className={`underline ${hoverRecolor}`}>
      {link.text}
    </a>
  ) : (
    <span data-testid="RecipeHead-source">{source}</span>
  );
}
