-- Categories are shared by name (case-insensitive); a recipe links to any number of them in a stored order.
CREATE TABLE categories (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL COLLATE NOCASE UNIQUE CHECK (length(trim(name)) > 0)
);

CREATE TABLE recipe_categories (
  recipe_id INTEGER NOT NULL REFERENCES recipes (id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories (id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  PRIMARY KEY (recipe_id, category_id)
);
