-- Configuration the app reads at run time, one JSON value per key. A setting is only ever overridden as a whole; no row means "use the defaults in code".
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL CHECK (json_valid(value))
);
