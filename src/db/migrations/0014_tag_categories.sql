-- A tag can have one optional category; a category exists only while a tag has it (removed by the application).
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL COLLATE NOCASE UNIQUE CHECK (name <> '')
);
ALTER TABLE tags ADD COLUMN category_id INTEGER REFERENCES categories(id);
