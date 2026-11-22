ALTER TABLE users
ADD COLUMN failed_logins integer NOT NULL DEFAULT 0,
ADD COLUMN locked_until timestamptz