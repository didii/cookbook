import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import {
  acceptProposal,
  addChip,
  canAdd,
  derive,
  discardProposal,
  editValues,
  nextChipId,
  proposal,
  removeChip,
  restoreGhost,
  setLabel,
  setMode,
  type Chip,
  type Context,
  type Ghost,
  type IngredientValues,
  type Kind,
  type OvenValues,
  type TimerValues,
  type Values,
} from '~/lib/chips';
import type { StepRow } from '~/lib/draft';
import { formatMinutes } from '~/lib/steps';
import { cn } from '~/shared/cn';
import { Arrow, Check, Clock, Cross, Ingredient, Link, Pin, Plus, Thermometer, Trash } from '~/shared/icons';
import { ChipPopup } from './ChipPopup';
import { proposalAttribute } from './OpenProposals';
import { useAfterRender } from './useAfterRender';

type Props = {
  step: StepRow;
  context: Context;
  /** The step's number, counting from 1. */
  number: number;
  /** The chip whose words are filled in the text (hovered or focused). */
  hotId?: string;
  onHot: (id: string | undefined) => void;
  /** Changes the step's chips with a function of the chip logic. */
  onChange: (change: (step: StepRow, context: Context) => StepRow) => void;
};

const chipClass =
  'relative inline-flex min-h-9 items-center gap-1.5 rounded-lg border-2 border-transparent bg-ink/8 px-2.5 text-[0.9375rem] font-bold text-muted hover:border-ink';
const faceClass = 'inline-flex min-h-9 cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 font-[inherit] text-[inherit]';
const modeClass =
  'grid size-6.5 -ml-1.5 cursor-pointer place-items-center rounded-md border-0 bg-transparent p-0 text-muted hover:bg-ink/12 hover:text-ink';
const addClass =
  'inline-flex min-h-9 cursor-pointer items-center gap-1 rounded-lg border-2 border-dashed border-ink/40 bg-transparent px-2.5 text-sm font-extrabold text-muted hover:border-solid hover:border-ink hover:text-ink';
const icon = 'size-[1.1em]';

const kindName: Record<Kind, string> = { ingredient: 'Ingrediënt', oven: 'Oven', timer: 'Timer' };

/** What a chip looks like: its icon, its values and, for a timer, its name. */
function Face({ kind, values, label }: { kind: Kind; values: Values; label?: string }): ReactNode {
  if (kind === 'oven')
    return (
      <>
        <Thermometer />
        <span>
          <b className="font-black text-red">{(values as OvenValues).degrees} °C</b> oven
        </span>
      </>
    );
  if (kind === 'timer')
    return (
      <>
        <Clock className={icon} />
        <span>
          <b className="font-black text-red">{formatMinutes((values as TimerValues).minutes)}</b>
          {label && ` · ${label}`}
        </span>
      </>
    );
  const { quantity, name } = values as IngredientValues;
  return (
    <>
      <Ingredient className={icon} />
      <span>
        {quantity && <b className="font-black text-blu">{quantity} </b>}
        {name || 'Ingrediënt'}
      </span>
    </>
  );
}

const KindIcon = ({ kind }: { kind: Kind }) =>
  kind === 'oven' ? <Thermometer /> : kind === 'timer' ? <Clock className={icon} /> : <Ingredient className={icon} />;

/** The chips of one step under its text, and the row to add one by hand or bring a removed one back. All of it is one toolbar: one Tab stop, the arrow keys move between the chips. */
export function StepChips({ step, context, number, hotId, onHot, onChange }: Props) {
  const toolbar = useRef<HTMLDivElement>(null);
  const afterRender = useAfterRender();
  const [current, setCurrent] = useState<string>();
  // The chip whose popup is open; it closes by itself when the chip goes or gets a proposal.
  const [openId, setOpenId] = useState<string>();
  const wrapper = useRef<HTMLDivElement>(null);

  const shown = step.chips.map((chip) => ({ chip, values: derive(chip, step.body, context), suggestion: proposal(chip, step.body, context) }));
  const open = shown.find(({ chip, suggestion }) => chip.id === openId && !suggestion);
  if (openId && !open) setOpenId(undefined);
  const addable = (['ingredient', 'oven', 'timer'] as const).filter((kind) => canAdd(step, kind));
  const keys = [
    ...shown.flatMap(({ chip, suggestion }) => (suggestion ? [`ok:${chip.id}`, `no:${chip.id}`] : [`chip:${chip.id}`])),
    ...step.ghosts.map((g) => `ghost:${g.id}`),
    ...addable.map((kind) => `add:${kind}`),
  ];
  // The one item in the Tab order: the last one used, or the first when that is gone.
  const stop = current && keys.includes(current) ? current : keys[0];
  const roving = (key: string) => ({ 'data-roving': key, tabIndex: key === stop ? 0 : -1, onFocus: () => setCurrent(key) });
  const items = () => [...(toolbar.current?.querySelectorAll<HTMLElement>('[data-roving]') ?? [])];
  const focusKey = (key: string, fallbackAt: number) =>
    afterRender(() => {
      const all = items();
      (all.find((el) => el.dataset.roving === key) ?? all[Math.min(fallbackAt, all.length - 1)])?.focus();
    });
  const at = (key: string) => keys.indexOf(key);

  const keyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const all = items();
    const index = all.indexOf(e.target as HTMLElement);
    if (index < 0 || e.nativeEvent.isComposing) return;
    const to = { ArrowRight: (index + 1) % all.length, ArrowLeft: (index + all.length - 1) % all.length, Home: 0, End: all.length - 1 }[e.key];
    if (to !== undefined) {
      e.preventDefault();
      all[to].focus();
    } else if (e.key === 'Delete') {
      const key = (e.target as HTMLElement).dataset.roving ?? '';
      if (key.startsWith('chip:')) {
        e.preventDefault();
        remove(key.slice(5), index);
      }
    }
  };

  const remove = (id: string, index: number) => {
    setOpenId(undefined);
    focusKey('', index);
    onChange((s, c) => removeChip(s, id, c));
  };
  const accept = (id: string) => {
    focusKey(`chip:${id}`, at(`ok:${id}`));
    onChange((s, c) => acceptProposal(s, id, c));
  };
  const discard = (id: string) => {
    focusKey(`chip:${id}`, at(`no:${id}`));
    onChange((s, c) => discardProposal(s, id, c));
  };
  const restore = (ghost: Ghost) => {
    focusKey(`chip:${ghost.id}`, at(`ghost:${ghost.id}`));
    onChange((s, c) => restoreGhost(s, ghost.id, c));
  };
  /** Adds a hand-made chip and opens its popup, to fill it in. */
  const add = (kind: Kind) => {
    const id = nextChipId(step);
    onChange((s) => addChip(s, kind, id));
    setOpenId(id);
  };
  /** The icon button: pins a following chip, makes a pinned chip with words follow them again, and opens the popup. */
  const switchMode = (chip: Chip) => {
    if (chip.mode === 'auto') onChange((s, c) => setMode(s, chip.id, 'manual', c));
    else if (chip.anchor && !chip.lost) onChange((s, c) => setMode(s, chip.id, 'auto', c));
    setOpenId(chip.id);
  };
  const close = (refocus: boolean) => {
    if (refocus && openId) focusKey(`chip:${openId}`, 0);
    setOpenId(undefined);
  };

  const hover = (id: string) => ({
    onMouseEnter: () => onHot(id),
    onMouseLeave: () => onHot(undefined),
    onFocus: () => onHot(id),
    onBlur: () => onHot(undefined),
  });
  const hot = (chip: Chip) => hotId === chip.id && (chip.mode === 'auto' ? 'border-ink bg-yel/50' : 'border-ink bg-blu/18');

  return (
    <div ref={wrapper} className="relative">
      {/* The group itself is not focusable: its buttons are, with a roving tabindex. */}
      {/* oxlint-disable-next-line jsx-a11y/interactive-supports-focus */}
      <div
        ref={toolbar}
        role="toolbar"
        aria-label={`Chips van stap ${number}`}
        onKeyDown={keyDown}
        className="mt-2.5 flex flex-wrap items-center gap-2"
      >
        {shown.map(({ chip, values, suggestion }) => {
          if (suggestion) {
            const removing = suggestion.type === 'remove';
            return (
              <span
                key={chip.id}
                {...hover(chip.id)}
                className={cn(
                  chipClass,
                  'gap-2 border-dashed pr-[3px]',
                  removing ? 'border-red bg-red/10 text-red hover:border-red' : 'border-blu bg-white hover:border-blu',
                  hotId === chip.id && (removing ? 'bg-red/20' : 'bg-blu/18'),
                )}
              >
                <Pin className={cn(icon, !removing && 'text-blu')} />
                {removing ? (
                  <span className="inline-flex items-center gap-1.5 line-through decoration-2">
                    <Face kind={chip.kind} values={chip.values} label={chip.kind === 'timer' ? chip.label : undefined} />
                  </span>
                ) : (
                  <>
                    <span className="inline-flex items-center gap-1.5 line-through decoration-2 opacity-65">
                      <Face kind={chip.kind} values={chip.values} label={chip.kind === 'timer' ? chip.label : undefined} />
                    </span>
                    <Arrow className={cn(icon, 'text-blu')} />
                    <span className="inline-flex items-center gap-1.5">
                      <Face kind={chip.kind} values={suggestion.values} label={chip.kind === 'timer' ? chip.label : undefined} />
                    </span>
                  </>
                )}
                <span className="inline-flex h-6.5 overflow-hidden rounded-md border-2 border-ink bg-white text-ink">
                  <button
                    type="button"
                    {...{ [proposalAttribute]: '' }}
                    aria-label={removing ? `${kindName[chip.kind]} verwijderen` : 'Wijziging overnemen'}
                    {...roving(`ok:${chip.id}`)}
                    onClick={() => accept(chip.id)}
                    className={cn(
                      'grid w-7 cursor-pointer place-items-center border-0 bg-transparent p-0 hover:bg-ink/8',
                      removing ? 'text-red' : 'text-jade',
                    )}
                  >
                    {removing ? <Trash className={icon} /> : <Check className={icon} />}
                  </button>
                  <button
                    type="button"
                    aria-label={removing ? `${kindName[chip.kind]} houden` : 'Oude waarde houden'}
                    {...roving(`no:${chip.id}`)}
                    onClick={() => discard(chip.id)}
                    className="grid w-7 cursor-pointer place-items-center border-0 border-l-2 border-ink bg-transparent p-0 text-muted hover:bg-ink/8"
                  >
                    <Cross className={icon} />
                  </button>
                </span>
              </span>
            );
          }
          const pinned = chip.mode === 'manual';
          return (
            <span key={chip.id} data-chip-id={chip.id} {...hover(chip.id)} className={cn(chipClass, pinned && 'border-ink bg-white', hot(chip))}>
              <button
                type="button"
                tabIndex={-1}
                aria-label={pinned ? (chip.anchor ? 'Laten volgen en openen' : 'Openen') : 'Vastzetten en openen'}
                onClick={() => switchMode(chip)}
                className={cn(modeClass, pinned && 'text-blu')}
              >
                {pinned ? <Pin className={icon} /> : <Link className={icon} />}
              </button>
              <button
                type="button"
                aria-haspopup="dialog"
                aria-expanded={openId === chip.id}
                {...roving(`chip:${chip.id}`)}
                onClick={() => setOpenId(openId === chip.id ? undefined : chip.id)}
                className={faceClass}
              >
                <Face kind={chip.kind} values={values} label={chip.kind === 'timer' ? chip.label : undefined} />
              </button>
            </span>
          );
        })}
        {/* Always takes its space, so nothing moves when it shows. */}
        <div
          className={cn(
            'flex flex-wrap gap-1.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100',
            '[@media(hover:none)]:opacity-100',
          )}
        >
          {addable.map((kind) => (
            <button
              key={kind}
              type="button"
              title={`${kindName[kind]} toevoegen`}
              aria-label={`${kindName[kind]} toevoegen`}
              {...roving(`add:${kind}`)}
              onClick={() => add(kind)}
              className={addClass}
            >
              <Plus className={icon} />
              <KindIcon kind={kind} />
            </button>
          ))}
          {step.ghosts.map((ghost) => (
            <button
              key={ghost.id}
              type="button"
              title="Terugzetten"
              aria-label={`${kindName[ghost.kind]} terugzetten: ${step.body.slice(ghost.anchor.start, ghost.anchor.end)}`}
              {...roving(`ghost:${ghost.id}`)}
              onClick={() => restore(ghost)}
              className={cn(addClass, 'border-solid border-ink/30 line-through decoration-[1.5px] hover:no-underline')}
            >
              <KindIcon kind={ghost.kind} />
              {step.body.slice(ghost.anchor.start, ghost.anchor.end)}
            </button>
          ))}
        </div>
      </div>
      {open && (
        <ChipPopup
          key={open.chip.id}
          chip={open.chip}
          values={open.values}
          words={open.chip.anchor && step.body.slice(open.chip.anchor.start, open.chip.anchor.end)}
          anchor={() => wrapper.current?.querySelector<HTMLElement>(`[data-chip-id="${open.chip.id}"]`)}
          onValues={(patch) => onChange((s, c) => editValues(s, open.chip.id, patch, c))}
          onLabel={(label) => onChange((s) => setLabel(s, open.chip.id, label))}
          onMode={(mode) => onChange((s, c) => setMode(s, open.chip.id, mode, c))}
          onRemove={() => remove(open.chip.id, at(`chip:${open.chip.id}`))}
          onClose={close}
        />
      )}
    </div>
  );
}
