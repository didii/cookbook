import type { RouteConfigEntry } from '@react-router/dev/routes';
import routes from '~/routes';

const paths = (entries: RouteConfigEntry[]): string[] => entries.flatMap((r) => [...(r.path ? [r.path] : []), ...paths(r.children ?? [])]);

/** The address patterns of the route table, including the routes inside layouts. */
export const routePaths = paths(routes);
