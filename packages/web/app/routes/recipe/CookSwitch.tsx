import { switchText, type LockState } from '~/lib/cookMode';

type Props = { wanted: boolean; lock: LockState; manual: boolean | undefined; onToggle: () => void };

/** The cook mode switch for narrow screens. Its text says whether the screen really stays awake, not what was asked for. */
export function CookSwitch({ wanted, lock, manual, onToggle }: Props) {
  const { title, sub } = switchText(wanted, lock, manual);
  const unable = wanted && (lock === 'unsupported' || lock === 'refused');

  return (
    <button
      type="button"
      role="switch"
      aria-checked={wanted}
      onClick={onToggle}
      className="group mt-6 flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-[0.625rem] border-3 border-ink bg-white py-1 pr-3.5 pl-2 text-left font-extrabold min-[52rem]:hidden"
    >
      <span
        aria-hidden="true"
        data-unable={unable || undefined}
        className="relative h-6.5 w-11 shrink-0 rounded-full border-3 border-ink bg-white transition-colors group-aria-checked:bg-jade data-unable:bg-yel motion-reduce:transition-none after:absolute after:top-px after:left-px after:size-4.5 after:rounded-full after:bg-ink after:transition-transform after:content-[''] group-aria-checked:after:translate-x-4.5group-aria-checked:after:bg-white motion-reduce:after:transition-none"
      />
      <span>
        {title}
        <small className="block text-[0.8125rem] font-bold text-muted">{sub}</small>
      </span>
    </button>
  );
}
