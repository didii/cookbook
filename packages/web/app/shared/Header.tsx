import { Link } from 'react-router';
import { Fret } from '~/shared/Fret';

export function Header({ email }: { email: string }) {
  return (
    <header className="bg-red text-white">
      <div className="flex items-center justify-between gap-4 px-[max(1rem,4vw)] py-3">
        <Link to="/" className="text-2xl font-black tracking-tight no-underline focus-visible:outline-white">
          Familiekookboek
        </Link>
        <span className="truncate text-sm font-bold">{email}</span>
      </div>
      <Fret size={14} className="mb-1.5 text-yel" />
    </header>
  );
}
