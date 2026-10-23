-- A family member: the verified email (case-insensitive) and what they like to be called. Nothing else is stored.
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  calling_name TEXT NOT NULL CHECK (length(trim(calling_name)) > 0),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
