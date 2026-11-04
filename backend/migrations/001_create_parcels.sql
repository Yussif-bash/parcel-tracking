CREATE TABLE parcels(
    id uuid PRIMARY KEY DEFAULT uuidv7(),
    tracking_code text NOT NULL UNIQUE,
    sender_name text NOT NULL,
    sender_phone text NOT NULL,
    receiver_name text NOT NULL,
    receiver_phone text NOT NULL,
    description text NOT NULL,
    status text NOT NULL DEFAULT 'REGISTERED',
    CHECK(status IN ('REGISTERED', 'IN_TRANSIT', 'ARRIVED', 'COLLECTED', 'CANCELLED')),
    created_at timestamptz NOT NULL DEFAULT now()
)