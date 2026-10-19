import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { StepRow } from '~/lib/draft';
import { Button } from '~/shared/Button';
import { Announcement } from './Announcement';
import type { ItemHandle } from './ItemHandle';
import { StepEditor } from './StepEditor';
import { useAfterRender } from './useAfterRender';
import { useReorder } from './useReorder';

type Props = {
  steps: StepRow[];
  onType: (id: string, body: string) => void;
  /** Add an empty step at a place. */
  onAdd: (at: number) => void;
  onRemove: (id: string) => void;
  /** Put a removed step back at the place it had. */
  onRestore: (step: StepRow, at: number) => void;
  /** Move a step to a place in the list. */
  onMove: (id: string, to: number) => void;
};

/** How long a removed step can be brought back. */
const undoSeconds = 8;

/** A step that was removed and can still be restored, with the place it had. */
type Removed = { step: StepRow; at: number };

/** The steps of a recipe: numbered, reorderable, with "Stap toevoegen" below, and the list as the form field `steps`. */
export function StepList({ steps, onType, onAdd, onRemove, onRestore, onMove }: Props) {
  const items = useRef(new Map<string, ItemHandle>());
  const undoButton = useRef<HTMLButtonElement>(null);
  // The steps as of the latest render, for focus requests that run after the next one. Declared before `useAfterRender`, so it is up to date when a request runs.
  const latest = useRef(steps);
  useLayoutEffect(() => {
    latest.current = steps;
  });
  const afterRender = useAfterRender();
  const [removed, setRemoved] = useState<Removed>();

  const reorder = useReorder({
    ids: steps.map((s) => s.id),
    gap: 0,
    rectOf: (id) => items.current.get(id)?.rect(),
    announce: (_, to) => `Stap staat nu op plaats ${to + 1} van ${steps.length}`,
    onMove,
  });

  // The undo offer ends after a while.
  useEffect(() => {
    if (!removed) return;
    const timer = setTimeout(() => setRemoved(undefined), undoSeconds * 1000);
    return () => clearTimeout(timer);
  }, [removed]);

  const focusStep = (index: number, caret: 'start' | 'end') => afterRender(() => items.current.get(latest.current[index]?.id)?.focusField(caret));

  const add = (at: number) => {
    setRemoved(undefined);
    focusStep(at, 'start');
    onAdd(at);
  };
  const type = (id: string, body: string) => {
    setRemoved(undefined);
    onType(id, body);
  };
  const move = (id: string, direction: -1 | 1) => {
    setRemoved(undefined);
    reorder.move(id, direction);
  };
  /** Removes a step. Focus goes to the step above (at its end), or to the one that takes its place; after a step with text it goes to the undo offer. */
  const remove = (id: string) => {
    const at = steps.findIndex((s) => s.id === id);
    const step = steps[at];
    if (step.body.trim()) {
      setRemoved({ step, at });
      afterRender(() => undoButton.current?.focus());
    } else {
      setRemoved(undefined);
      if (at > 0) focusStep(at - 1, 'end');
      else focusStep(0, 'start');
    }
    onRemove(id);
  };
  const restore = () => {
    if (!removed) return;
    focusStep(removed.at, 'end');
    onRestore(removed.step, removed.at);
    setRemoved(undefined);
  };

  const offer = removed && (
    <li key="removed" className="flex items-center gap-3 rounded-[0.625rem] bg-ink/7 px-3 py-2 font-bold">
      <output>Stap verwijderd</output>
      <span aria-hidden="true">·</span>
      <button ref={undoButton} type="button" onClick={restore} className="cursor-pointer font-black text-blu underline underline-offset-4">
        Ongedaan maken
      </button>
    </li>
  );

  return (
    <div>
      <input type="hidden" name="steps" value={JSON.stringify(steps.map((s) => ({ body: s.body })))} />
      <ol className="m-0 grid list-none p-0">
        {steps.map((step, i) => (
          <Fragment key={step.id}>
            {removed?.at === i && offer}
            <StepEditor
              ref={(handle) => {
                if (handle) items.current.set(step.id, handle);
                else items.current.delete(step.id);
              }}
              number={i + 1}
              text={step.body}
              canUp={i > 0}
              canDown={i < steps.length - 1}
              onType={(body) => type(step.id, body)}
              onEnterAtEnd={() => add(i + 1)}
              onBackspaceEmpty={() => steps.length > 1 && remove(step.id)}
              onRemove={() => remove(step.id)}
              onMove={(direction) => move(step.id, direction)}
              gripProps={reorder.gripProps(i)}
              style={reorder.styleOf(i)}
            />
          </Fragment>
        ))}
        {removed && removed.at >= steps.length && offer}
      </ol>
      <Button type="button" onClick={() => add(steps.length)} className="mt-4 w-full border-dashed bg-transparent shadow-none">
        Stap toevoegen
      </Button>
      <Announcement text={reorder.announcement} />
    </div>
  );
}
