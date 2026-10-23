-- That a member opened a recipe, once per member and recipe. Behind the "Nieuw" marker on the home page.
CREATE TABLE recipe_views (
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  recipe_id INTEGER NOT NULL REFERENCES recipes (id) ON DELETE CASCADE,
  first_opened_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  PRIMARY KEY (user_id, recipe_id)
);
