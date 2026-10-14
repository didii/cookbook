import { Link } from 'react-router';

export function Header({ email }: { email: string }) {
  return (
    <header className="flex items-center justify-between gap-4 border-b-4 border-ink bg-red px-[max(1rem,4vw)] py-3 text-white">
      <Link to="/" className="text-2xl font-black tracking-tight no-underline focus-visible:outline-white">
        Familiekookboek
      </Link>
      <span className="truncate text-sm font-bold">{email}</span>
    </header>
  );
}
