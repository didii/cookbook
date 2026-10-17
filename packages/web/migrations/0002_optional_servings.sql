-- Servings becomes optional. SQLite cannot drop NOT NULL, so the four tables are rebuilt. The children are dropped before
-- their parent so no cascade can delete data, and the copies are made first.
CREATE TABLE recipes_new (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  time TEXT,
  servings INTEGER CHECK (servings > 0),
  intro TEXT NOT NULL DEFAULT '',
  image TEXT,
  seal TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE ingredients_new (
  id INTEGER PRIMARY KEY,
  recipe_id INTEGER NOT NULL REFERENCES recipes_new (id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  name TEXT NOT NULL,
  quantity_text TEXT NOT NULL DEFAULT '',
  amount REAL CHECK (amount > 0),
  unit TEXT,
  UNIQUE (recipe_id, position),
  UNIQUE (id, recipe_id)
);

CREATE TABLE steps_new (
  id INTEGER PRIMARY KEY,
  recipe_id INTEGER NOT NULL REFERENCES recipes_new (id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  body TEXT NOT NULL,
  image TEXT,
  image_alt TEXT,
  UNIQUE (recipe_id, position),
  UNIQUE (id, recipe_id)
);

CREATE TABLE step_ingredients_new (
  step_id INTEGER NOT NULL,
  ingredient_id INTEGER NOT NULL,
  recipe_id INTEGER NOT NULL,
  amount REAL CHECK (amount > 0),
  unit TEXT,
  PRIMARY KEY (step_id, ingredient_id),
  FOREIGN KEY (step_id, recipe_id) REFERENCES steps_new (id, recipe_id) ON DELETE CASCADE,
  FOREIGN KEY (ingredient_id, recipe_id) REFERENCES ingredients_new (id, recipe_id) ON DELETE CASCADE
);

INSERT INTO recipes_new SELECT * FROM recipes;
INSERT INTO ingredients_new SELECT * FROM ingredients;
INSERT INTO steps_new SELECT * FROM steps;
INSERT INTO step_ingredients_new SELECT * FROM step_ingredients;

DROP TABLE step_ingredients;
DROP TABLE steps;
DROP TABLE ingredients;
DROP TABLE recipes;

ALTER TABLE recipes_new RENAME TO recipes;
ALTER TABLE ingredients_new RENAME TO ingredients;
ALTER TABLE steps_new RENAME TO steps;
ALTER TABLE step_ingredients_new RENAME TO step_ingredients;
