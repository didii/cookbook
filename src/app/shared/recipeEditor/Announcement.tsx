/** A visually hidden live region: the text is read out by assistive technology when it changes. */
export function Announcement({ text }: { text: string }) {
  return (
    <div aria-live="polite" data-testid="Announcement-live" className="sr-only">
      {text}
    </div>
  );
}
