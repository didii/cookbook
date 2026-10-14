import { useState } from "react";

import { Button } from "~/shared/Button";

type Props = { steps: string[] };

export function StepList({ steps }: Props) {
  const [current, setCurrent] = useState(0);

  return (
    <ol className="grid list-none gap-3 p-0">
      {steps.map((s, i) => (
        <li key={i} className="rounded-xl has-aria-[current=step]:border-3 has-aria-[current=step]:border-ink has-aria-[current=step]:bg-white has-aria-[current=step]:pb-4 has-aria-[current=step]:shadow-hard-red">
          <button
            className="group block w-full cursor-pointer rounded-xl border-3 border-transparent bg-transparent px-4 py-3 text-left text-muted aria-[current=step]:text-[clamp(1.375rem,3.2vw,1.75rem)] aria-[current=step]:leading-[1.3] aria-[current=step]:font-extrabold aria-[current=step]:text-ink"
            onClick={() => setCurrent(i)}
            aria-current={i === current ? "step" : undefined}
          >
            <small className="block text-[0.8125rem] font-extrabold tracking-[0.08em] uppercase group-aria-[current=step]:text-sm group-aria-[current=step]:text-red">
              Stap {i + 1} van {steps.length}
            </small>
            <span>{s}</span>
          </button>
          {i === current && (
            <div className="flex gap-3 px-4">
              <Button disabled={i === 0} onClick={() => setCurrent(i - 1)}>
                Vorige
              </Button>
              <Button main disabled={i === steps.length - 1} onClick={() => setCurrent(i + 1)}>
                Volgende
              </Button>
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}
