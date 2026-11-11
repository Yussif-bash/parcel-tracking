CREATE TABLE users(
    id uuid PRIMARY KEY DEFAULT uuidv7(),
    name text NOT NULL,
    phone text NOT NULL UNIQUE,
    passwaord_hash text NOT NULL,
    role text check(role IN ('ADMIN', 'CASHIER', 'DRIVER', 'OWNER')),
    active boolean DEFAULT true,
    createdAt timestamptz NOT NULL DEFAULT now()
)