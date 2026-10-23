import { index, layout, route, type RouteConfig } from '@react-router/dev/routes';

export default [
  route('welkom', 'routes/welcome/WelcomePageRoute.tsx'),
  route('foto', 'routes/photo/PhotoUploadRoute.ts'),
  route('foto/:file', 'routes/photo/PhotoFetchRoute.ts'),
  route('recepten/:slug/favoriet', 'routes/recipe/LikeUpdateRoute.ts'),
  route('recepten/:slug/notitie', 'routes/recipe/NoteUpdateRoute.ts'),
  layout('routes/layout/LayoutRoute.tsx', [
    index('routes/home/HomePageRoute.tsx'),
    route('instellingen', 'routes/settings/SettingsPageRoute.tsx'),
    route('beheer/herkenning', 'routes/admin-rules/AdminRulesPageRoute.tsx'),
    route('beheer/gebruikers', 'routes/admin-users/AdminUsersPageRoute.tsx', [route(':id', 'routes/admin-users/AdminUserPageRoute.tsx')]),
    route('over', 'routes/about/AboutPageRoute.tsx'),
    route('recepten/nieuw', 'routes/new-recipe/NewRecipePageRoute.tsx'),
    route('recepten/:slug/bewerken', 'routes/edit-recipe/EditRecipePageRoute.tsx'),
    route('recepten/:slug', 'routes/recipe/RecipePageRoute.tsx'),
  ]),
] satisfies RouteConfig;
