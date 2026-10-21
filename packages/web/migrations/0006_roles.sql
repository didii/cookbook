-- A member's role. Members who joined before roles existed get 'user'.
ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin'));
