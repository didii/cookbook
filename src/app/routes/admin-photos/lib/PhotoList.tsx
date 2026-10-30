import { useEffect, useRef, useState } from 'react';
import { Link, useFetcher, useSearchParams } from 'react-router';
import { Button, Chip } from '~app/shared/components';
import { hoverUnderline } from '~app/shared/hover';
import { Check, Info, Trash } from '~app/shared/icons';
import { DeleteDialog } from './DeleteDialog';
import { formatSize, photoCount } from './format';
import { withFilter, type DeleteResult, type PhotoFilters, type StoredPhotoInfo } from './photos';
import { PhotoTile } from './PhotoTile';

interface PhotoListProps {
  /** The photos to list, oldest first, already limited to the cap. */
  photos: StoredPhotoInfo[];
  /** How many photos match the filters, which may be more than are listed. */
  matches: number;
  filters: PhotoFilters;
}

const link = `min-h-11 cursor-pointer px-1 font-extrabold text-blu underline decoration-2 underline-offset-3 ${hoverUnderline}`;
const notice = 'mt-3 flex items-start gap-2.5 rounded-[0.625rem] border-3 border-ink bg-white px-3.5 py-2.5 font-bold';

/** The page body: the totals and the selection, the two filters, the photos as tiles, and the bar that deletes the selection after a confirmation. */
export function PhotoList({ photos, matches, filters }: PhotoListProps) {
  const [params, setParams] = useSearchParams();
  const fetcher = useFetcher<DeleteResult>();
  const dialog = useRef<HTMLDialogElement>(null);
  const resultRef = useRef<HTMLOutputElement>(null);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [result, setResult] = useState<DeleteResult>();

  // Each answer replaces the shown result and empties the selection: reset while rendering the answer, not in an effect.
  const [seen, setSeen] = useState(fetcher.data);
  if (fetcher.data !== seen) {
    setSeen(fetcher.data);
    setResult(fetcher.data);
    setSelected(new Set());
  }
  useEffect(() => {
    if (!result) return;
    resultRef.current?.focus();
    window.scrollTo({ top: 0 });
  }, [result]);

  // Used photos are shown but cannot be selected, so the counts and "Alles selecteren" leave them out.
  const selectable = photos.filter((p) => !p.recipe);
  const chosen = selectable.filter((p) => selected.has(p.name));
  const inUse = photos.length - selectable.length;
  const sum = (list: StoredPhotoInfo[]) => formatSize(list.reduce((total, p) => total + p.size, 0));

  const toggle = (name: string, on: boolean) =>
    setSelected((s) => {
      const next = new Set(s);
      if (on) next.add(name);
      else next.delete(name);
      return next;
    });
  // Another filter is another list: the selection and the result of the last delete go.
  const flip = (filter: keyof PhotoFilters) => {
    setSelected(new Set());
    setResult(undefined);
    void setParams(withFilter(params, filter, !filters[filter]), { preventScrollReset: true });
  };
  const confirm = () => {
    dialog.current?.close();
    const form = new FormData();
    for (const { name } of chosen) form.append('naam', name);
    void fetcher.submit(form, { method: 'post' });
  };

  const keptSlugs = new Set<string>();
  const keptLinks = result?.kept.filter(({ slug }) => !keptSlugs.has(slug) && keptSlugs.add(slug));
  const filtered = filters.onlyUnused || filters.onlyOld;

  return (
    <div className="pb-28">
      {result && (
        <output ref={resultRef} tabIndex={-1} data-testid="PhotoList-result" className={`${notice} border-jade focus:outline-none`}>
          <Check className="mt-0.5 text-jade" />
          <span>
            <b data-testid="PhotoList-deleted" className="font-black">
              {photoCount(result.deleted)} verwijderd.
            </b>
            {keptLinks?.length ? (
              <>
                {' '}
                <span data-testid="PhotoList-kept">
                  {photoCount(result.kept.length)} bewaard, want {result.kept.length === 1 ? 'een recept gebruikt hem' : 'recepten gebruiken ze'}{' '}
                  intussen:
                </span>{' '}
                {keptLinks.map(({ slug, title }, i) => (
                  <span key={slug}>
                    {i > 0 && ', '}
                    <Link to={`/recepten/${slug}`} target="_blank" rel="noopener" data-testid="PhotoList-keptLink" className={link}>
                      {title}
                    </Link>
                  </span>
                ))}
                .
              </>
            ) : null}
          </span>
        </output>
      )}

      {selectable.length > 0 && (
        <p className="mt-5 flex flex-wrap items-center gap-x-3">
          <b data-testid="PhotoList-count" className="text-[1.375rem] font-black tabular-nums">
            {chosen.length}/{selectable.length} foto&apos;s
          </b>
          <small data-testid="PhotoList-bytes" className="text-base font-extrabold text-muted">
            {sum(chosen)} / {sum(selectable)}
          </small>
          {inUse > 0 && (
            <small data-testid="PhotoList-inUse" className="text-base font-extrabold text-muted">
              · {inUse} in gebruik
            </small>
          )}
          <span className="ml-auto flex gap-2">
            <button type="button" data-testid="PhotoList-all" onClick={() => setSelected(new Set(selectable.map((p) => p.name)))} className={link}>
              Alles selecteren
            </button>
            {chosen.length > 0 && (
              <button type="button" data-testid="PhotoList-none" onClick={() => setSelected(new Set())} className={link}>
                Niets
              </button>
            )}
          </span>
        </p>
      )}

      <fieldset className="mt-2.5 flex flex-wrap gap-2">
        <legend className="sr-only">Filters</legend>
        <Chip data-testid="PhotoList-unused" pressed={filters.onlyUnused} onClick={() => flip('onlyUnused')}>
          Ongebruikt
        </Chip>
        <Chip data-testid="PhotoList-old" pressed={filters.onlyOld} onClick={() => flip('onlyOld')}>
          Ouder dan 1 dag
        </Chip>
      </fieldset>

      {matches > photos.length && (
        <div data-testid="PhotoList-cap" className={notice}>
          <Info className="mt-0.5 text-muted" />
          <span>
            Je ziet de oudste {photos.length} van {matches}. Na het verwijderen komen de volgende in beeld.
          </span>
        </div>
      )}

      {photos.length ? (
        <ul aria-label="Foto's" className="mt-4 grid grid-cols-2 gap-3 min-[30rem]:grid-cols-3 sm:grid-cols-4 sm:gap-4">
          {photos.map((photo) => (
            <PhotoTile key={photo.name} photo={photo} checked={selected.has(photo.name)} onChange={(on) => toggle(photo.name, on)} />
          ))}
        </ul>
      ) : (
        <div
          data-testid="PhotoList-empty"
          className="mt-6 rounded-[0.625rem] border-3 border-ink bg-white px-5 py-9 text-center font-bold text-muted"
        >
          <Check className="mx-auto size-11 text-jade" />
          <b className="mt-2 block text-[1.375rem] font-black text-ink">{filtered ? 'Niets om op te ruimen' : "Geen foto's"}</b>
          <p className="mx-auto mt-1.5 max-w-104">
            {filtered ? "Er zijn geen foto's die bij de filters passen." : 'Er staat nog niets in de opslag.'}
          </p>
        </div>
      )}

      {selectable.length > 0 && (
        <div data-testid="PhotoList-bar" className="fixed inset-x-0 bottom-0 z-10 border-t-3 border-ink bg-por pb-[env(safe-area-inset-bottom)]">
          <div className="mx-auto flex max-w-3xl flex-wrap gap-2 px-[max(1rem,4vw)] py-2.5">
            <Button
              type="button"
              data-testid="PhotoList-delete"
              disabled={chosen.length === 0 || fetcher.state !== 'idle'}
              onClick={() => dialog.current?.showModal()}
              className="inline-flex min-h-12 flex-auto items-center justify-center gap-1.5 bg-red px-4 text-base text-white hover:not-disabled:bg-red hover:not-disabled:brightness-90 sm:flex-none"
            >
              <Trash /> Verwijder selectie
            </Button>
          </div>
        </div>
      )}

      <DeleteDialog ref={dialog} photos={chosen} onCancel={() => dialog.current?.close()} onConfirm={confirm} />
    </div>
  );
}
