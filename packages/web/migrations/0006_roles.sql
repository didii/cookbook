-- A member's role. Members who joined before roles existed get 'user'.
ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin'));

-- The first superadmin exists before they have signed in, so they never see the welcome screen. If they already signed in, they are promoted.
INSERT INTO users (email, calling_name, role) VALUES ('info@rhythm-coder.dev', 'Dieter', 'superadmin')
ON CONFLICT (email) DO UPDATE SET role = 'superadmin';
