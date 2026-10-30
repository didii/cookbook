-- Size limits on recipe text, enforced by the database. SQLite cannot add a CHECK to an existing column, so recipes, ingredients, steps and step_ingredient_chips are rebuilt (and step_ingredients and step_quantities with them, which hang from those).
-- Dropping a table deletes the rows that reference it (ON DELETE CASCADE), so every table that depends on them is copied aside first and copied back after, with the same ids.
-- Keep the numbers in line with `limits` in recipeValidation.ts. The number of rows (ingredients, steps, chips, tags) is limited in code only.

CREATE TABLE copy_recipes AS SELECT * FROM recipes;
CREATE TABLE copy_ingredients AS SELECT * FROM ingredients;
CREATE TABLE copy_steps AS SELECT * FROM steps;
CREATE TABLE copy_step_ingredients AS SELECT * FROM step_ingredients;
CREATE TABLE copy_step_ingredient_chips AS SELECT * FROM step_ingredient_chips;
CREATE TABLE copy_step_quantities AS SELECT * FROM step_quantities;
CREATE TABLE copy_recipe_views AS SELECT * FROM recipe_views;
CREATE TABLE copy_recipe_likes AS SELECT * FROM recipe_likes;
CREATE TABLE copy_recipe_notes AS SELECT * FROM recipe_notes;
CREATE TABLE copy_recipe_tags AS SELECT * FROM recipe_tags;

-- Children of steps and ingredients go first, or deleting their parents would fail on a reference to a table that is already gone.
DROP TABLE step_quantities;
DROP TABLE step_ingredients;
DROP TABLE step_ingredient_chips;
DROP TABLE steps;
DROP TABLE ingredients;
DROP TABLE recipes;

CREATE TABLE recipes (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL CHECK (length(title) <= 200),
  author TEXT NOT NULL CHECK (length(author) <= 100),
  time TEXT CHECK (length(time) <= 100),
  servings INTEGER CHECK (servings BETWEEN 1 AND 999),
  intro TEXT NOT NULL DEFAULT '' CHECK (length(intro) <= 5000),
  image TEXT,
  seal TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX recipes_seal ON recipes (seal);

CREATE TABLE ingredients (
  id INTEGER PRIMARY KEY,
  recipe_id INTEGER NOT NULL REFERENCES recipes (id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  name TEXT NOT NULL CHECK (length(name) <= 200),
  quantity_text TEXT NOT NULL DEFAULT '' CHECK (length(quantity_text) <= 200),
  quantity_value REAL CHECK (quantity_value > 0),
  quantity_unit TEXT,
  quantity_value_max REAL CHECK (quantity_value_max IS NULL OR (quantity_value_max > 0 AND quantity_value IS NOT NULL)),
  UNIQUE (recipe_id, position),
  UNIQUE (id, recipe_id)
);

CREATE TABLE steps (
  id INTEGER PRIMARY KEY,
  recipe_id INTEGER NOT NULL REFERENCES recipes (id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  body TEXT NOT NULL CHECK (length(body) <= 2000),
  image TEXT,
  image_alt TEXT,
  oven_temperature INTEGER CHECK (oven_temperature > 0),
  timer_minutes INTEGER CHECK (timer_minutes > 0),
  timer_label TEXT CHECK ((timer_label IS NULL OR timer_minutes IS NOT NULL) AND length(timer_label) <= 100),
  UNIQUE (recipe_id, position),
  UNIQUE (id, recipe_id)
);

CREATE TABLE step_ingredient_chips (
  step_id INTEGER NOT NULL REFERENCES steps (id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  quantity_text TEXT NOT NULL DEFAULT '' CHECK (length(quantity_text) <= 50),
  name TEXT NOT NULL CHECK (name <> '' AND length(name) <= 200),
  quantity_value REAL CHECK (quantity_value > 0),
  quantity_unit TEXT,
  quantity_value_max REAL CHECK (quantity_value_max IS NULL OR (quantity_value_max > 0 AND quantity_value IS NOT NULL)),
  PRIMARY KEY (step_id, position)
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

CREATE TABLE step_quantities (
  step_id INTEGER NOT NULL REFERENCES steps (id) ON DELETE CASCADE,
  start_index INTEGER NOT NULL,
  end_index INTEGER NOT NULL,
  quantity_value REAL NOT NULL CHECK (quantity_value > 0),
  quantity_value_max REAL CHECK (quantity_value_max > 0),
  max_start_index INTEGER,
  max_end_index INTEGER,
  quantity_unit TEXT,
  PRIMARY KEY (step_id, start_index),
  CHECK (end_index > start_index),
  CHECK ((quantity_value_max IS NULL) = (max_start_index IS NULL) AND (quantity_value_max IS NULL) = (max_end_index IS NULL)),
  CHECK (max_start_index IS NULL OR (max_start_index >= end_index AND max_end_index > max_start_index))
);

-- Parents before children.
INSERT INTO recipes (id, slug, title, author, time, servings, intro, image, seal, created_by, created_at, updated_at)
  SELECT id, slug, title, author, time, servings, intro, image, seal, created_by, created_at, updated_at FROM copy_recipes;
INSERT INTO ingredients (id, recipe_id, position, name, quantity_text, quantity_value, quantity_unit, quantity_value_max)
  SELECT id, recipe_id, position, name, quantity_text, quantity_value, quantity_unit, quantity_value_max FROM copy_ingredients;
INSERT INTO steps (id, recipe_id, position, body, image, image_alt, oven_temperature, timer_minutes, timer_label)
  SELECT id, recipe_id, position, body, image, image_alt, oven_temperature, timer_minutes, timer_label FROM copy_steps;
INSERT INTO step_ingredients (step_id, ingredient_id, recipe_id, amount, unit)
  SELECT step_id, ingredient_id, recipe_id, amount, unit FROM copy_step_ingredients;
INSERT INTO step_ingredient_chips (step_id, position, quantity_text, name, quantity_value, quantity_unit, quantity_value_max)
  SELECT step_id, position, quantity_text, name, quantity_value, quantity_unit, quantity_value_max FROM copy_step_ingredient_chips;
INSERT INTO step_quantities (step_id, start_index, end_index, quantity_value, quantity_value_max, max_start_index, max_end_index, quantity_unit)
  SELECT step_id, start_index, end_index, quantity_value, quantity_value_max, max_start_index, max_end_index, quantity_unit FROM copy_step_quantities;
INSERT INTO recipe_views (user_id, recipe_id, first_opened_at) SELECT user_id, recipe_id, first_opened_at FROM copy_recipe_views;
INSERT INTO recipe_likes (user_id, recipe_id) SELECT user_id, recipe_id FROM copy_recipe_likes;
INSERT INTO recipe_notes (user_id, recipe_id, body, updated_at) SELECT user_id, recipe_id, body, updated_at FROM copy_recipe_notes;
INSERT INTO recipe_tags (recipe_id, tag_id) SELECT recipe_id, tag_id FROM copy_recipe_tags;

DROP TABLE copy_recipe_tags;
DROP TABLE copy_recipe_notes;
DROP TABLE copy_recipe_likes;
DROP TABLE copy_recipe_views;
DROP TABLE copy_step_quantities;
DROP TABLE copy_step_ingredient_chips;
DROP TABLE copy_step_ingredients;
DROP TABLE copy_steps;
DROP TABLE copy_ingredients;
DROP TABLE copy_recipes;
