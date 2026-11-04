CREATE TABLE parcels(
    id uuid PRIMARY KEY DEFAULT uuidv7(),
    tracking_code text NOT NULL UNIQUE,
    send_name text NOT NULL,
    send_number text NOT NULL,
    reciever_name text NOT NULL,
    reciever_number text NOT NULL,
    description text NOT NULL,
    status text NOT NULL DEFAULT 'REGISTERED',
    CHECK(status IN ('REGISTERED', 'IN_TRANSIT', 'ARRIVED', 'COLLECTED', 'CANCELLED')),
    created_at timestamptz NOT NULL DEFAULT now()
)