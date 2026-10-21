-- Elevated roles by email (case-insensitive). No row means the member is a plain user, so 'user' is never stored.
-- Keyed by email, not users.id: the superadmin is seeded before they have been welcomed and have a users row.
CREATE TABLE roles (
  email TEXT PRIMARY KEY COLLATE NOCASE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'superadmin'))
);

INSERT INTO roles (email, role) VALUES ('info@rhythm-coder.dev', 'superadmin');
