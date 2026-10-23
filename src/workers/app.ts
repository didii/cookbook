import { createRequestHandler } from 'react-router';
import { createFetch } from './handler';

const requestHandler = createRequestHandler(() => import('virtual:react-router/server-build'), import.meta.env.MODE);

export default {
  // Stand-in identity is compiled out of production builds.
  fetch: createFetch({ requestHandler, dev: import.meta.env.DEV }),
} satisfies ExportedHandler<Env>;
