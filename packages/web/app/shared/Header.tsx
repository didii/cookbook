import { Link } from 'react-router';
import { Fret } from '~/shared/Fret';
import { SiteMenu } from '~/shared/SiteMenu';

export function Header({ email }: { email: string }) {
  return (
    <header className="bg-red text-white">
      <div className="flex items-center justify-between gap-4 px-[max(1rem,4vw)] py-3">
        <Link to="/" className="text-2xl font-black tracking-tight no-underline focus-visible:outline-white">
          Familiekookboek
        </Link>
        <div className="flex min-w-0 items-center gap-4">
          {/* The email is hidden on phones: the row has no room for both it and the link. */}
          <span data-testid="Header-email" className="hidden truncate text-sm font-bold sm:inline">
            {email}
          </span>
          <Link
            to="/recepten/nieuw"
            data-testid="Header-new"
            className="flex min-h-11 shrink-0 items-center rounded-[0.625rem] border-3 border-white px-3 font-black no-underline focus-visible:outline-white"
          >
            <span data-testid="Header-newShort" className="sm:hidden">
              + Nieuw
            </span>
            <span data-testid="Header-newLong" className="hidden sm:inline">
              Nieuw recept
            </span>
          </Link>
          <SiteMenu />
        </div>
      </div>
      <Fret size={14} className="mb-1.5 text-yel" />
    </header>
  );
}
