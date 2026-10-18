import type { Step } from '~/lib/steps';

const I = (quantity: string, name: string) => ({ quantity, name });
const step = (body: string, chips: Partial<Step['chips']> = {}): Step => ({ body, chips: { ingredients: [], oven: [], timers: [], ...chips } });

/** The Appeltaart of the design preview: 13 steps with every kind of chip. */
export const appeltaartSteps: Step[] = [
  step('Kneed bloem, boter, suiker, ei en zout snel tot een deeg.', {
    ingredients: [I('250 g', 'zelfrijzende bloem'), I('150 g', 'koude boter'), I('100 g', 'basterdsuiker'), I('1', 'ei'), I('½ tl', 'zout')],
  }),
  step('Wikkel het deeg in folie en laat het 30 minuten rusten in de koelkast.', { timers: [{ minutes: 30, label: 'Deeg rust' }] }),
  step('Verwarm de oven voor. Vet een springvorm in met een klein klontje boter.', {
    oven: [{ degrees: 180 }],
    ingredients: [I('1 klontje', 'boter')],
  }),
  step('Schil de appels, snijd ze in blokjes en meng ze met de kaneel.', { ingredients: [I('1 kg', 'zure appels'), I('¾ tl', 'kaneel')] }),
  step('Smoor de appelblokjes zachtjes in een pan met een snuifje zout tot ze net zacht zijn. Roer af en toe.', {
    ingredients: [I('1 snuf', 'zout')],
    timers: [{ minutes: 20, label: 'Appels smoren' }],
  }),
  step('Giet de appels af in een vergiet en laat ze goed uitlekken en afkoelen, anders wordt de bodem nat.', {
    timers: [{ minutes: 10, label: 'Uitlekken' }],
  }),
  step('Bekleed de vorm met tweederde van het deeg en prik de bodem in met een vork.'),
  step('Verdeel de appels over de bodem en strijk ze glad tot aan de rand.'),
  step('Snijd de rest van het deeg in repen en leg een rooster over de appels. Bestrijk de randen met losgeklopt ei.', {
    ingredients: [I('1', 'losgeklopt ei')],
  }),
  step('Bak de taart in het midden van de oven tot ze goudbruin is.', { oven: [{ degrees: 180 }], timers: [{ minutes: 50, label: 'Bakken' }] }),
  step('Laat de taart in de vorm afkoelen voor je aansnijdt. Warm snijden geeft een rommelige taart.', {
    timers: [{ minutes: 45, label: 'Afkoelen' }],
  }),
  step('Maak de rand los met een mes en haal de springvorm eraf. Bestuif met poedersuiker.', { ingredients: [I('2 el', 'poedersuiker')] }),
  step('Serveer met een flinke klodder slagroom. Bewaar de rest afgedekt in de koelkast, ze blijft drie dagen goed.', {
    ingredients: [I('1 bakje', 'slagroom')],
  }),
];
