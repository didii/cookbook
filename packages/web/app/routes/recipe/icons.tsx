import { cn } from '~/shared/cn';

type Props = { className?: string };

const icon = (className?: string) => ({ viewBox: '0 0 16 16', 'aria-hidden': true, className: cn('size-4 shrink-0', className) }) as const;

export const Play = ({ className }: Props) => (
  <svg {...icon(className)}>
    <path d="M3 1.5v13l11-6.5z" fill="currentColor" />
  </svg>
);

export const Stop = ({ className }: Props) => (
  <svg {...icon(className)}>
    <rect x="3" y="3" width="10" height="10" rx="1.5" fill="currentColor" />
  </svg>
);

/** An alarm clock: the app a timer is handed to. */
export const Alarm = ({ className }: Props) => (
  <svg {...icon(className)}>
    <circle cx="8" cy="9" r="5" fill="none" stroke="currentColor" strokeWidth="1.6" />
    <path d="M8 6.2V9l2 1.2M2 4l2.5-2M14 4l-2.5-2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export const Thermometer = ({ className }: Props) => (
  <svg {...icon(className)}>
    <path d="M6 9.2V3a2 2 0 1 1 4 0v6.2a3.5 3.5 0 1 1-4 0z" fill="none" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="8" cy="11.5" r="1.6" fill="currentColor" />
  </svg>
);
