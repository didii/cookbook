import { Link } from 'react-router';
import { Fret } from './Fret';
import { SiteMenu } from './SiteMenu';
import type { Role } from '../role';

export function Header({ email, role }: { email: string; role: Role }) {
  return (
    <header className="min-h-header bg-red text-white">
      <div className="flex items-center justify-between gap-4 py-3 pr-[max(1rem,4vw)] pl-[max(0.5rem,calc(4vw-0.5rem))]">
        <div className="flex min-w-0 items-center gap-2">
          <SiteMenu role={role} />
          <Link to="/" className="truncate text-2xl font-black tracking-tight no-underline focus-visible:outline-white">
            Familiekookboek
          </Link>
        </div>
        <span className="hidden truncate text-sm font-bold sm:inline">{email}</span>
      </div>
      <Fret size={14} className="mb-1.5 text-yel" />
    </header>
  );
}
