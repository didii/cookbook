-- A member's share link of a recipe: at most one per member per recipe. expires_at is NULL for a link that never ends.
CREATE TABLE recipe_shares (
  id INTEGER PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  recipe_id INTEGER NOT NULL REFERENCES recipes (id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  UNIQUE (recipe_id, user_id)
);

CREATE INDEX recipe_shares_user_id ON recipe_shares (user_id);
