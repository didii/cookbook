import { index, route, type RouteConfig } from '@react-router/dev/routes';

export default [
  index('routes/home/route.tsx'),
  route('foto', 'routes/photo/upload.ts'),
  route('foto/:file', 'routes/photo/file.ts'),
  route('recepten/nieuw', 'routes/new-recipe/route.tsx'),
  route('recepten/:slug/bewerken', 'routes/edit-recipe/route.tsx'),
  route('recepten/:slug', 'routes/recipe/route.tsx'),
] satisfies RouteConfig;
