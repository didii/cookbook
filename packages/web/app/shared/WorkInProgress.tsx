export function WorkInProgress({ title }: { title: string }) {
  return (
    <main id="main" className="mx-auto max-w-3xl px-[max(1rem,4vw)] pt-8 pb-16">
      <h1 className="text-[clamp(2rem,6vw,3rem)] leading-[1.05] font-black tracking-[-0.03em]">{title}</h1>
      <output className="mt-6 block border-3 border-ink bg-yel p-4 font-bold">Dit scherm is nog in aanbouw</output>
    </main>
  );
}
