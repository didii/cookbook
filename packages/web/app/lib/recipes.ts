// Sample content for design work. Replace with real family recipes (and a D1 table) later.
export type Recipe = {
  slug: string;
  title: string;
  by: string;
  time: string;
  servings: number;
  image: string;
  intro: string;
  ingredients: { q: string; item: string }[];
  steps: string[];
};

export const recipes: Recipe[] = [
  {
    slug: 'appeltaart',
    title: 'Appeltaart',
    by: 'Oma',
    time: '1u 20',
    servings: 8,
    image: '/img/appeltaart.jpg',
    intro: 'Met een dikke laag zure appels en een rooster van deeg bovenop.',
    ingredients: [
      { q: '250 g', item: 'zelfrijzend bloem' },
      { q: '150 g', item: 'koude boter' },
      { q: '100 g', item: 'basterdsuiker' },
      { q: '1', item: 'ei' },
      { q: '½ tl', item: 'zout' },
      { q: '1 kg', item: 'zure appels' },
      { q: '¾ tl', item: 'kaneel' },
    ],
    steps: [
      'Kneed bloem, boter, suiker, ei en zout snel tot een deeg. Laat 30 minuten rusten in de koelkast.',
      'Verwarm de oven voor op 180 °C. Vet een springvorm in.',
      'Schil de appels, snijd ze in blokjes en meng ze met de kaneel.',
      'Bekleed de vorm met tweederde van het deeg. Verdeel de appels over de bodem.',
      'Snijd de rest van het deeg in repen en leg een rooster over de appels.',
      'Bak de taart 50 minuten tot ze goudbruin is. Laat afkoelen voor je aansnijdt.',
    ],
  },
  {
    slug: 'stoofvlees',
    title: 'Stoofvlees',
    by: 'Papa',
    time: '3u 00',
    servings: 6,
    image: '/img/stoofvlees.jpg',
    intro: 'Langzaam gaar in donker bier, met een snee brood met mosterd erin.',
    ingredients: [
      { q: '1 kg', item: 'rundsstoofvlees' },
      { q: '3', item: 'grote uien' },
      { q: '50 g', item: 'boter' },
      { q: '50 cl', item: 'donker bier' },
      { q: '2 sneden', item: 'peperkoek of brood' },
      { q: '2 el', item: 'mosterd' },
      { q: '2', item: 'laurierblaadjes' },
    ],
    steps: [
      'Snijd de uien in halve ringen. Bak het vlees bruin in de boter en haal het uit de pan.',
      'Smoor de uien zacht in dezelfde pan.',
      'Doe het vlees terug en blus met het bier. Voeg de laurier toe.',
      'Smeer de mosterd op het brood en leg het bovenop het vlees.',
      'Laat 2,5 uur zachtjes sudderen met het deksel half op de pan.',
    ],
  },
  {
    slug: 'pannenkoeken',
    title: 'Pannenkoeken',
    by: 'Tante An',
    time: '30 min',
    servings: 4,
    image: '/img/pannenkoeken.jpg',
    intro: 'Dun en groot, met stroop of spek.',
    ingredients: [
      { q: '250 g', item: 'bloem' },
      { q: '2', item: 'eieren' },
      { q: '5 dl', item: 'melk' },
      { q: '1 snuf', item: 'zout' },
      { q: '', item: 'boter om te bakken' },
    ],
    steps: [
      'Klop bloem, eieren, melk en zout tot een gladde, dunne beslag.',
      'Laat de beslag 15 minuten rusten.',
      'Verhit een klein beetje boter in een koekenpan en bak de pannenkoeken goudbruin aan beide kanten.',
    ],
  },
  {
    slug: 'erwtensoep',
    title: 'Erwtensoep',
    by: 'Opa',
    time: '2u 30',
    servings: 8,
    image: '/img/erwtensoep.jpg',
    intro: 'Zo dik dat de lepel rechtop blijft staan.',
    ingredients: [
      { q: '500 g', item: 'spliterwten' },
      { q: '2 l', item: 'water' },
      { q: '400 g', item: 'doorregen spek' },
      { q: '1', item: 'knolselderij' },
      { q: '2', item: 'preien' },
      { q: '1', item: 'rookworst' },
    ],
    steps: [
      'Breng erwten, water en spek aan de kook en laat 1,5 uur zachtjes koken.',
      'Snijd de groenten klein en voeg ze toe. Kook nog 30 minuten.',
      'Verwarm de rookworst de laatste 15 minuten mee. Snijd in plakken en roer door de soep.',
    ],
  },
  {
    slug: 'rijstpap',
    title: 'Rijstpap',
    by: 'Oma',
    time: '45 min',
    servings: 4,
    image: '/img/rijstpap.jpg',
    intro: 'Met bruine suiker en een klontje boter.',
    ingredients: [
      { q: '1 l', item: 'volle melk' },
      { q: '100 g', item: 'puddingrijst' },
      { q: '1 snuf', item: 'zout' },
      { q: '', item: 'bruine suiker' },
      { q: '', item: 'boter' },
    ],
    steps: [
      'Breng de melk met het zout aan de kook en strooi de rijst erin.',
      'Laat 35 minuten zachtjes pruttelen en roer regelmatig zodat niets aanbrandt.',
      'Schep in kommen en strooi bruine suiker en een klontje boter erop.',
    ],
  },
  {
    slug: 'frikandellen',
    title: 'Frikandellen',
    by: 'Papa',
    time: '25 min',
    servings: 4,
    image: '/img/frikandellen.jpg',
    intro: 'Uit de frituur, met curry en uitjes.',
    ingredients: [
      { q: '4', item: 'frikandellen' },
      { q: '1', item: 'ui' },
      { q: '', item: 'curryketchup' },
      { q: '', item: 'mayonaise' },
    ],
    steps: [
      'Frituur de frikandellen 5 minuten tot ze bruin zijn.',
      'Snijd de ui fijn.',
      'Snijd de frikandellen open en leg ze op een bord met saus en ui.',
    ],
  },
];

export const findRecipe = (slug: string | undefined) => recipes.find((r) => r.slug === slug);
