import type { ComponentProps } from 'react';
import { cn } from '../cn';

interface AnnouncementProps extends ComponentProps<'div'> {
  text: string;
}

/** A visually hidden live region: the text is read out by assistive technology when it changes. */
export function Announcement({ text, className, ...props }: AnnouncementProps) {
  return (
    <div {...props} aria-live="polite" data-testid="Announcement-live" className={cn('sr-only', className)}>
      {text}
    </div>
  );
}
