import { cloudflare } from '@cloudflare/vite-plugin';
import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';

export default defineConfig(({ command }) => ({
  plugins: [
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tailwindcss(),
    reactRouter(),
    command === 'serve' && checker({ typescript: { tsconfigPath: 'tsconfig.cloudflare.json' }, oxlint: true }),
  ],
  resolve: {
    tsconfigPaths: true,
  },
}));
