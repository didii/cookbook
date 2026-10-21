import { useRef } from 'react';
import { Link } from 'react-router';
import { Cross, Menu } from '~/shared/icons';

const links = [
  { to: '/recepten/nieuw', label: 'Nieuw recept' },
  { to: '/instellingen', label: 'Instellingen' },
  { to: '/over', label: 'Over' },
];
const focus = 'focus-visible:outline-white';

/** Menu button with a sidebar. A modal `<dialog>` gives the focus trap, Escape and backdrop. */
export function SiteMenu() {
  const dialog = useRef<HTMLDialogElement>(null);
  const close = () => dialog.current?.close();
  return (
    <>
      <button
        type="button"
        aria-label="Menu"
        onClick={() => dialog.current?.showModal()}
        className={`flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center rounded-[0.625rem] border-3 border-white ${focus}`}
      >
        <Menu />
      </button>
      {/* A click on the dialog itself is a click on the backdrop: the panel's content covers the rest. */}
      {/* oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- Escape is native; this is the backdrop click. */}
      <dialog
        ref={dialog}
        aria-label="Menu"
        onClick={(e) => e.target === e.currentTarget && close()}
        className="m-0 h-full max-h-none w-72 max-w-[85vw] border-r-3 border-white bg-red p-4 text-white backdrop:bg-black/50"
      >
        <button
          type="button"
          aria-label="Sluit menu"
          onClick={close}
          className={`mb-4 flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-[0.625rem] border-3 border-white ${focus}`}
        >
          <Cross />
        </button>
        <nav className="flex flex-col gap-2">
          {links.map(({ to, label }) => (
            <Link key={to} to={to} onClick={close} className={`flex min-h-11 items-center px-2 text-lg font-black no-underline ${focus}`}>
              {label}
            </Link>
          ))}
        </nav>
      </dialog>
    </>
  );
}
