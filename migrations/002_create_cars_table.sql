-- Create cars table with UUID v7
CREATE TABLE
    cars (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL,
        brand VARCHAR(100) NOT NULL,
        model VARCHAR(100) NOT NULL,
        year INTEGER NOT NULL,
        color VARCHAR(50),
        license_plate VARCHAR(20) UNIQUE NOT NULL,
        is_available BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

-- Create indexes
CREATE INDEX idx_cars_user_id ON cars (user_id);

CREATE INDEX idx_cars_brand ON cars (brand);

CREATE INDEX idx_cars_license_plate ON cars (license_plate);

CREATE INDEX idx_cars_is_available ON cars (is_available);

CREATE INDEX idx_cars_created_at ON cars (created_at);

-- Trigger for cars
CREATE TRIGGER update_cars_updated_at BEFORE
UPDATE ON cars FOR EACH ROW EXECUTE FUNCTION update_updated_at_column ();