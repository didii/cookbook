import { index, layout, route, type RouteConfig } from '@react-router/dev/routes';

export default [
  route('welkom', 'routes/welcome/route.tsx'),
  route('foto', 'routes/photo/upload.ts'),
  route('foto/:file', 'routes/photo/file.ts'),
  route('recepten/:slug/favoriet', 'routes/recipe/like.ts'),
  route('recepten/:slug/notitie', 'routes/recipe/note.ts'),
  layout('routes/layout/route.tsx', [
    index('routes/home/route.tsx'),
    route('instellingen', 'routes/settings/route.tsx'),
    route('beheer/herkenning', 'routes/admin-rules/route.tsx'),
    route('over', 'routes/about/route.tsx'),
    route('recepten/nieuw', 'routes/new-recipe/route.tsx'),
    route('recepten/:slug/bewerken', 'routes/edit-recipe/route.tsx'),
    route('recepten/:slug', 'routes/recipe/route.tsx'),
  ]),
] satisfies RouteConfig;
