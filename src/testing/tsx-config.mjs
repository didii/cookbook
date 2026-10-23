// Loaded before tsx: tsx only applies tsconfig.json to files it includes, and ours is a solution file, so point it at the config with the JSX settings.
process.env.TSX_TSCONFIG_PATH ??= new URL('../../tsconfig.cloudflare.json', import.meta.url).pathname.replace(/^\/(\w:)/, '$1');
