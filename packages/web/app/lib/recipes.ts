// Sample content for design work. Replace with real family recipes (and a D1 table) later.

/** An ingredient row of a recipe, or a chip of a step: free text, a step's chip never refers to a row. Same shape as the stored ingredient. */
export type Ingredient = { quantity_text: string; name: string };

/** A step and what belongs to it: the ingredients it uses, an oven temperature and a timer, all optional. */
export type Step = {
  body: string;
  ingredients: Ingredient[];
  ovenTemperature?: number;
  timer?: { minutes: number; label?: string };
};

/** The recipe as the page wants it. Field names follow `StoredRecipe`, which is meant to become this type. */
export type Recipe = {
  id: number;
  slug: string;
  title: string;
  author: string;
  time: string | null;
  servings: number | null;
  intro: string;
  image: string | null;
  seal: string | null;
  ingredients: Ingredient[];
  steps: Step[];
};

const i = (quantity_text: string, name: string): Ingredient => ({ quantity_text, name });
const step = (body: string, rest: Partial<Omit<Step, 'body'>> = {}): Step => ({ body, ingredients: [], ...rest });

export const recipes: Recipe[] = [
  {
    id: 1,
    slug: 'appeltaart',
    title: 'Appeltaart',
    author: 'Oma',
    time: '1u 20',
    servings: 8,
    image: '/img/appeltaart.jpg',
    seal: 'jia-wei',
    intro: 'Met een dikke laag zure appels en een rooster van deeg bovenop.',
    ingredients: [
      i('250 g', 'zelfrijzende bloem'),
      i('150 g', 'koude boter'),
      i('100 g', 'basterdsuiker'),
      i('1', 'ei'),
      i('½ tl', 'zout'),
      i('1 kg', 'zure appels'),
      i('¾ tl', 'kaneel'),
    ],
    steps: [
      step('Kneed bloem, boter, suiker, ei en zout snel tot een deeg.', {
        ingredients: [i('250 g', 'zelfrijzende bloem'), i('150 g', 'koude boter'), i('100 g', 'basterdsuiker'), i('1', 'ei'), i('½ tl', 'zout')],
      }),
      step('Wikkel het deeg in folie en laat het 30 minuten rusten in de koelkast.', { timer: { minutes: 30, label: 'Deeg rust' } }),
      step('Verwarm de oven voor. Vet een springvorm in met een klein klontje boter.', {
        ovenTemperature: 180,
        ingredients: [i('1 klontje', 'boter')],
      }),
      step('Schil de appels, snijd ze in blokjes en meng ze met de kaneel.', { ingredients: [i('1 kg', 'zure appels'), i('¾ tl', 'kaneel')] }),
      step('Smoor de appelblokjes zachtjes in een pan met een snuifje zout tot ze net zacht zijn. Roer af en toe.', {
        ingredients: [i('1 snuf', 'zout')],
        timer: { minutes: 20, label: 'Appels smoren' },
      }),
      step('Giet de appels af in een vergiet en laat ze goed uitlekken en afkoelen, anders wordt de bodem nat.', {
        timer: { minutes: 10, label: 'Uitlekken' },
      }),
      step('Bekleed de vorm met tweederde van het deeg en prik de bodem in met een vork.'),
      step('Verdeel de appels over de bodem en strijk ze glad tot aan de rand.'),
      step('Snijd de rest van het deeg in repen en leg een rooster over de appels. Bestrijk de randen met losgeklopt ei.', {
        ingredients: [i('1', 'losgeklopt ei')],
      }),
      step('Bak de taart in het midden van de oven tot ze goudbruin is.', { ovenTemperature: 180, timer: { minutes: 50, label: 'Bakken' } }),
      step('Laat de taart in de vorm afkoelen voor je aansnijdt. Warm snijden geeft een rommelige taart.', {
        timer: { minutes: 45, label: 'Afkoelen' },
      }),
      step('Maak de rand los met een mes en haal de springvorm eraf. Bestuif met poedersuiker.', { ingredients: [i('2 el', 'poedersuiker')] }),
      step('Serveer met een flinke klodder slagroom. Bewaar de rest afgedekt in de koelkast, ze blijft drie dagen goed.', {
        ingredients: [i('1 bakje', 'slagroom')],
      }),
    ],
  },
  {
    id: 2,
    slug: 'stoofvlees',
    title: 'Stoofvlees',
    author: 'Papa',
    time: '3u 00',
    servings: 6,
    image: '/img/stoofvlees.jpg',
    seal: 'jia-chang-bian-fan',
    intro: 'Langzaam gaar in donker bier, met een snee brood met mosterd erin.',
    ingredients: [
      i('1 kg', 'rundsstoofvlees'),
      i('3', 'grote uien'),
      i('50 g', 'boter'),
      i('50 cl', 'donker bier'),
      i('2 sneden', 'peperkoek of brood'),
      i('2 el', 'mosterd'),
      i('2', 'laurierblaadjes'),
    ],
    steps: [
      step('Snijd de uien in halve ringen. Bak het vlees bruin in de boter en haal het uit de pan.'),
      step('Smoor de uien zacht in dezelfde pan.'),
      step('Doe het vlees terug en blus met het bier. Voeg de laurier toe.'),
      step('Smeer de mosterd op het brood en leg het bovenop het vlees.'),
      step('Laat 2,5 uur zachtjes sudderen met het deksel half op de pan.'),
    ],
  },
  {
    id: 3,
    slug: 'pannenkoeken',
    title: 'Pannenkoeken',
    author: 'Tante An',
    time: '30 min',
    servings: 4,
    image: '/img/pannenkoeken.jpg',
    seal: 'kai-fan',
    intro: 'Dun en groot, met stroop of spek.',
    ingredients: [i('250 g', 'bloem'), i('2', 'eieren'), i('5 dl', 'melk'), i('1 snuf', 'zout'), i('', 'boter om te bakken')],
    steps: [
      step('Klop bloem, eieren, melk en zout tot een gladde, dunne beslag.'),
      step('Laat de beslag 15 minuten rusten.'),
      step('Verhit een klein beetje boter in een koekenpan en bak de pannenkoeken goudbruin aan beide kanten.'),
    ],
  },
  {
    id: 4,
    slug: 'erwtensoep',
    title: 'Erwtensoep',
    author: 'Opa',
    time: '2u 30',
    servings: 8,
    image: '/img/erwtensoep.jpg',
    seal: 'hui-wei-wu-qiong',
    intro: 'Zo dik dat de lepel rechtop blijft staan.',
    ingredients: [
      i('500 g', 'spliterwten'),
      i('2 l', 'water'),
      i('400 g', 'doorregen spek'),
      i('1', 'knolselderij'),
      i('2', 'preien'),
      i('1', 'rookworst'),
    ],
    steps: [
      step('Breng erwten, water en spek aan de kook en laat 1,5 uur zachtjes koken.'),
      step('Snijd de groenten klein en voeg ze toe. Kook nog 30 minuten.'),
      step('Verwarm de rookworst de laatste 15 minuten mee. Snijd in plakken en roer door de soep.'),
    ],
  },
  {
    id: 5,
    slug: 'rijstpap',
    title: 'Rijstpap',
    author: 'Oma',
    time: '45 min',
    servings: 4,
    image: '/img/rijstpap.jpg',
    seal: 'fu',
    intro: 'Met bruine suiker en een klontje boter.',
    ingredients: [i('1 l', 'volle melk'), i('100 g', 'puddingrijst'), i('1 snuf', 'zout'), i('', 'bruine suiker'), i('', 'boter')],
    steps: [
      step('Breng de melk met het zout aan de kook en strooi de rijst erin.'),
      step('Laat 35 minuten zachtjes pruttelen en roer regelmatig zodat niets aanbrandt.'),
      step('Schep in kommen en strooi bruine suiker en een klontje boter erop.'),
    ],
  },
  {
    id: 6,
    slug: 'frikandellen',
    title: 'Frikandellen',
    author: 'Papa',
    time: '25 min',
    servings: 4,
    image: '/img/frikandellen.jpg',
    seal: 'suan-tian-ku-la',
    intro: 'Uit de frituur, met curry en uitjes.',
    ingredients: [i('4', 'frikandellen'), i('1', 'ui'), i('', 'curryketchup'), i('', 'mayonaise')],
    steps: [
      step('Frituur de frikandellen 5 minuten tot ze bruin zijn.'),
      step('Snijd de ui fijn.'),
      step('Snijd de frikandellen open en leg ze op een bord met saus en ui.'),
    ],
  },
];

export const findRecipe = (slug: string | undefined) => recipes.find((r) => r.slug === slug);
