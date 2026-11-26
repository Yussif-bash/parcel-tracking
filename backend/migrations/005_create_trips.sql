CREATE TABLE trips(
    id uuid PRIMARY KEY DEFAULT uuidv7(),
    driver_id uuid NOT NULL REFERENCES users(id),
    vehicle_number text NOT NULL,
    destination text NOT NULL,
    status text NOT NULL DEFAULT 'PLANNED',
    CHECK(status IN ('PLANNED', 'DEPARTED', 'ARRIVED', 'CANCELLED')),
    departed_at timestamptz,
    arrived_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE parcels
ADD COLUMN trip_id uuid REFERENCES trips(id) ON DELETE SET NULL;

CREATE INDEX idx_parcels_trip_id ON parcels(trip_id);