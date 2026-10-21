import { useRef } from 'react';
import { Link } from 'react-router';
import type { Role } from '~/.server/users';
import { Cross, Menu } from '~/shared/icons';

const links = [
  { to: '/recepten/nieuw', label: 'Nieuw recept' },
  { to: '/instellingen', label: 'Instellingen' },
  { to: '/over', label: 'Over' },
  { to: '/beheer/herkenning', label: 'Herkenning', admin: true },
];
const focus = 'focus-visible:outline-white';
const iconButton = `flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-[0.625rem] hover:bg-white/15 ${focus}`;

/** Menu button with a sidebar that slides in from the left. A modal `<dialog>` gives the focus trap, Escape and backdrop. */
export function SiteMenu({ role }: { role: Role }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const close = () => dialog.current?.close();
  return (
    <>
      <button
        type="button"
        aria-label="Menu"
        data-testid="SiteMenu-open"
        onClick={() => dialog.current?.showModal()}
        className={`shrink-0 ${iconButton}`}
      >
        <Menu />
      </button>
      {/* A click on the dialog itself is a click on the backdrop: the panel div fills the dialog, so everything inside it hits that div. */}
      {/* oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- Escape is native; this is the backdrop click. */}
      <dialog
        ref={dialog}
        data-testid="SiteMenu-dialog"
        aria-label="Menu"
        onClick={(e) => e.target === e.currentTarget && close()}
        className="m-0 h-full max-h-none w-72 max-w-[85vw] -translate-x-full border-r-3 border-ink bg-red p-0 text-white transition-[translate,display,overlay] duration-200 transition-discrete open:translate-x-0 starting:open:-translate-x-full backdrop:bg-black/50 motion-reduce:transition-none"
      >
        <div data-testid="SiteMenu-panel" className="h-full p-4">
          <button type="button" aria-label="Sluit menu" data-testid="SiteMenu-close" onClick={close} className={`mb-4 ${iconButton}`}>
            <Cross />
          </button>
          <nav className="flex flex-col gap-2">
            {links
              .filter((l) => !l.admin || role !== 'user')
              .map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={close}
                  data-testid="SiteMenu-link"
                  className={`flex min-h-11 items-center rounded-[0.625rem] px-2 text-lg font-black no-underline hover:bg-white/15 ${focus}`}
                >
                  {label}
                </Link>
              ))}
          </nav>
        </div>
      </dialog>
    </>
  );
}
