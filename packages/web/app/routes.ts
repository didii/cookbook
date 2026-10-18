import { index, route, type RouteConfig } from '@react-router/dev/routes';

export default [
  index('routes/home/route.tsx'),
  route('recepten/nieuw', 'routes/new-recipe/route.tsx'),
  // Dev only: the recipe page with fixture chips, until chips are stored.
  ...(import.meta.env.DEV ? [route('recepten/voorbeeld', 'routes/recipe-demo/route.tsx')] : []),
  route('recepten/:slug/bewerken', 'routes/edit-recipe/route.tsx'),
  route('recepten/:slug', 'routes/recipe/route.tsx'),
] satisfies RouteConfig;
