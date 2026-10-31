import { index, layout, route, type RouteConfig } from '@react-router/dev/routes';

export default [
  route('welkom', 'routes/welcome/WelcomePageRoute.tsx'),
  route('foto', 'routes/photo/PhotoUploadRoute.ts'),
  route('foto/:file', 'routes/photo/PhotoFetchRoute.ts'),
  route('importeren/pagina', 'routes/import-fetch/ImportPageFetchRoute.ts'),
  route('importeren/foto', 'routes/import-fetch/ImportImageFetchRoute.ts'),
  route('recepten/:slug/favoriet', 'routes/recipe/LikeUpdateRoute.ts'),
  route('recepten/:slug/notitie', 'routes/recipe/NoteUpdateRoute.ts'),
  route('recepten/:slug/verwijderen', 'routes/recipe/RecipeDeleteRoute.ts'),
  route('recepten/:slug/delen', 'routes/recipe/ShareCreateRoute.ts'),  layout('routes/layout/LayoutRoute.tsx', [
    index('routes/home/HomePageRoute.tsx'),
    route('koelkast', 'routes/fridge/FridgePageRoute.tsx'),
    route('instellingen', 'routes/settings/SettingsPageRoute.tsx'),
    route('beheer', 'routes/admin/AdminLayoutRoute.tsx', [
      index('routes/admin/AdminIndexRoute.ts'),
      route('herkenning', 'routes/admin-rules/AdminRulesPageRoute.tsx'),
      route('fotos', 'routes/admin-photos/AdminPhotosPageRoute.tsx'),
      route('gebruikers', 'routes/admin-users/AdminUsersPageRoute.tsx', [route(':id', 'routes/admin-users/AdminUserPageRoute.tsx')]),
    ]),
    route('over', 'routes/about/AboutPageRoute.tsx'),
    route('tags', 'routes/tags/TagsPageRoute.tsx'),
    route('recepten/nieuw', 'routes/edit-recipe/NewRecipePageRoute.tsx'),
    route('recepten/importeren', 'routes/edit-recipe/ImportRecipePageRoute.tsx'),
    route('recepten/:slug/bewerken', 'routes/edit-recipe/EditRecipePageRoute.tsx'),
    route('recepten/:slug', 'routes/recipe/RecipePageRoute.tsx'),
  ]),
] satisfies RouteConfig;
