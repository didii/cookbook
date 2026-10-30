import { Switch } from '@base-ui/react/switch';
import type { ComponentProps } from 'react';
import { cn } from '~app/shared/cn';
import { switchText, type LockState } from './cookMode';

interface CookSwitchProps extends ComponentProps<'label'> {
  wanted: boolean;
  lock: LockState;
  manual: boolean | undefined;
  onToggle: () => void;
}

/** The cook mode switch for narrow screens. Its text says whether the screen really stays awake, not what was asked for. */
export function CookSwitch({ wanted, lock, manual, onToggle, className, ...props }: CookSwitchProps) {
  const { title, sub } = switchText(wanted, lock, manual);
  const unable = wanted && (lock === 'unsupported' || lock === 'refused');

  return (
    <label
      {...props}
      data-testid="CookSwitch-label"
      className={cn(
        'mt-6 flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-[0.625rem] border-3 border-ink bg-white py-1 pr-3.5 pl-2 text-left font-extrabold hover:bg-hover min-[52rem]:hidden',
        className,
      )}
    >
      <Switch.Root
        checked={wanted}
        onCheckedChange={onToggle}
        data-testid="CookSwitch-switch"
        data-unable={unable || undefined}
        className="flex h-6.5 w-11 shrink-0 cursor-pointer items-center rounded-full border-3 border-ink bg-white p-0 transition-colors data-checked:bg-jade data-unable:bg-yel motion-reduce:transition-none"
      >
        <Switch.Thumb className="block size-4.5 translate-x-px rounded-full bg-ink transition-transform data-checked:translate-x-4.75 data-checked:bg-white motion-reduce:transition-none" />
      </Switch.Root>
      <span data-testid="CookSwitch-text">
        {title}
        <small data-testid="CookSwitch-sub" className="block text-[0.8125rem] font-bold text-muted">
          {sub}
        </small>
      </span>
    </label>
  );
}
