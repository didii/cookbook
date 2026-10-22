-- A member's private like and note per recipe. A like is the existence of a row; an emptied note has no row.
CREATE TABLE recipe_likes (
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  recipe_id INTEGER NOT NULL REFERENCES recipes (id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, recipe_id)
);

CREATE TABLE recipe_notes (
  user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  recipe_id INTEGER NOT NULL REFERENCES recipes (id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (length(trim(body, ' ' || char(9, 10, 13))) > 0),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  PRIMARY KEY (user_id, recipe_id)
);
