import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [index('routes/home/route.tsx'), route('recepten/:slug', 'routes/recipe/route.tsx')] satisfies RouteConfig;
