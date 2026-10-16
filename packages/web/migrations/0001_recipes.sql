CREATE TABLE recipes (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  time TEXT,
  servings INTEGER NOT NULL CHECK (servings > 0),
  intro TEXT NOT NULL DEFAULT '',
  image TEXT,
  seal TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE ingredients (
  id INTEGER PRIMARY KEY,
  recipe_id INTEGER NOT NULL REFERENCES recipes (id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  name TEXT NOT NULL,
  quantity_text TEXT NOT NULL DEFAULT '',
  amount REAL CHECK (amount > 0),
  unit TEXT,
  UNIQUE (recipe_id, position),
  UNIQUE (id, recipe_id)
);

CREATE TABLE steps (
  id INTEGER PRIMARY KEY,
  recipe_id INTEGER NOT NULL REFERENCES recipes (id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  body TEXT NOT NULL,
  image TEXT,
  image_alt TEXT,
  UNIQUE (recipe_id, position),
  UNIQUE (id, recipe_id)
);

CREATE TABLE step_ingredients (
  step_id INTEGER NOT NULL,
  ingredient_id INTEGER NOT NULL,
  recipe_id INTEGER NOT NULL,
  amount REAL CHECK (amount > 0),
  unit TEXT,
  PRIMARY KEY (step_id, ingredient_id),
  FOREIGN KEY (step_id, recipe_id) REFERENCES steps (id, recipe_id) ON DELETE CASCADE,
  FOREIGN KEY (ingredient_id, recipe_id) REFERENCES ingredients (id, recipe_id) ON DELETE CASCADE
);
