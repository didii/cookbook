import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("recepten/:slug", "routes/recipe.tsx"),
] satisfies RouteConfig;
