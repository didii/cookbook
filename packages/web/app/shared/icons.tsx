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

const outline = (className?: string) =>
  ({
    viewBox: '0 0 24 24',
    'aria-hidden': true,
    className: cn('size-5 shrink-0 fill-none stroke-current stroke-2 [stroke-linecap:round] [stroke-linejoin:round]', className),
  }) as const;

export const Camera = ({ className }: Props) => (
  <svg {...outline(className)}>
    <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
    <circle cx="12" cy="13" r="3.5" />
  </svg>
);

export const Trash = ({ className }: Props) => (
  <svg {...outline(className)}>
    <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
  </svg>
);

export const Up = ({ className }: Props) => (
  <svg {...outline(className)}>
    <path d="M6 15l6-6 6 6" />
  </svg>
);

export const Down = ({ className }: Props) => (
  <svg {...outline(className)}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export const Cross = ({ className }: Props) => (
  <svg {...outline(className)}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const Check = ({ className }: Props) => (
  <svg {...outline(className)}>
    <path d="M5 12.5l4.5 4.5L19 7" />
  </svg>
);

export const Plus = ({ className }: Props) => (
  <svg {...outline(className)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const Arrow = ({ className }: Props) => (
  <svg {...outline(className)}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

/** A chain link: the chip follows the text. */
export const Link = ({ className }: Props) => (
  <svg {...outline(className)}>
    <path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1" />
  </svg>
);

/** A pin: the chip keeps its values. */
export const Pin = ({ className }: Props) => (
  <svg {...outline(className)}>
    <path d="M12 17v5M8 3h8l-1 7 3 4H6l3-4z" />
  </svg>
);

/** A stopwatch: a timer chip. */
export const Clock = ({ className }: Props) => (
  <svg {...outline(className)}>
    <circle cx="12" cy="13" r="8" />
    <path d="M12 9v4l2.5 2M9.5 2h5" />
  </svg>
);
