-- =============================================================================
--  FleetFlow — Production PostgreSQL Schema
--  Architect: Senior Backend / Database Engineer
--  Version  : 1.0.0
--  Engine   : PostgreSQL 15+
-- =============================================================================
--
--  Schema layout
--  ─────────────
--  core.*      → transactional tables (vehicles, drivers, trips, logs)
--  analytics.* → read-optimised views & materialized views for dashboards
--
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 0.  HOUSEKEEPING
-- ---------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "btree_gist"; -- exclusion constraints (overlap)

-- Drop and recreate schemas for a clean slate (dev/CI use)
DROP SCHEMA IF EXISTS analytics CASCADE;
DROP SCHEMA IF EXISTS core      CASCADE;

CREATE SCHEMA core;
CREATE SCHEMA analytics;

-- Convenience: set search path so we don't prefix every object
SET search_path = core, public;


-- ---------------------------------------------------------------------------
-- 1.  SHARED DOMAIN TYPES  (enums live at the database level)
-- ---------------------------------------------------------------------------

-- Using PostgreSQL enum types gives you:
--  a) storage efficiency (4 bytes vs variable-length text)
--  b) automatic CHECK enforcement — no extra constraint needed
--  c) documented, discoverable vocabulary

CREATE TYPE core.vehicle_status_t AS ENUM (
    'available',
    'in_trip',
    'under_maintenance',
    'decommissioned'
);

CREATE TYPE core.trip_status_t AS ENUM (
    'scheduled',
    'in_progress',
    'completed',
    'cancelled'
);

CREATE TYPE core.fuel_type_t AS ENUM (
    'petrol',
    'diesel',
    'electric',
    'hybrid',
    'cng'
);

CREATE TYPE core.driver_status_t AS ENUM (
    'active',
    'on_leave',
    'suspended',
    'terminated'
);

CREATE TYPE core.maintenance_type_t AS ENUM (
    'preventive',
    'corrective',
    'inspection',
    'recall'
);

CREATE TYPE core.expense_category_t AS ENUM (
    'fuel',
    'maintenance',
    'toll',
    'insurance',
    'salary',
    'miscellaneous'
);


-- ---------------------------------------------------------------------------
-- 2.  CORE TABLES
-- ---------------------------------------------------------------------------

-- ── 2.1  VEHICLES ──────────────────────────────────────────────────────────
--
--  Design notes:
--  • capacity_kg is the gross vehicle weight limit used to validate trip cargo.
--  • odometer_km is updated on trip completion via trigger (see Section 5).
--  • We store fuel_type here because it drives fuel_log validation.

CREATE TABLE core.vehicles (
    vehicle_id          UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_no     VARCHAR(20)             NOT NULL,
    make                VARCHAR(60)             NOT NULL,
    model               VARCHAR(60)             NOT NULL,
    year                SMALLINT                NOT NULL,
    fuel_type           core.fuel_type_t        NOT NULL,
    capacity_kg         NUMERIC(8, 2)           NOT NULL,
    status              core.vehicle_status_t   NOT NULL DEFAULT 'available',
    odometer_km         NUMERIC(10, 2)          NOT NULL DEFAULT 0,
    purchased_on        DATE,
    created_at          TIMESTAMPTZ             NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ             NOT NULL DEFAULT now(),

    -- ── Constraints ────────────────────────────────────────────────────────
    CONSTRAINT uq_vehicles_registration   UNIQUE (registration_no),
    CONSTRAINT ck_vehicles_year           CHECK  (year BETWEEN 1980 AND EXTRACT(YEAR FROM now()) + 1),
    CONSTRAINT ck_vehicles_capacity       CHECK  (capacity_kg > 0),
    CONSTRAINT ck_vehicles_odometer       CHECK  (odometer_km >= 0)
);

COMMENT ON TABLE  core.vehicles                IS 'Master registry of all fleet vehicles.';
COMMENT ON COLUMN core.vehicles.capacity_kg    IS 'Maximum payload the vehicle is certified to carry (kg).';
COMMENT ON COLUMN core.vehicles.odometer_km    IS 'Running total distance — updated by trigger on trip completion.';


-- ── 2.2  DRIVERS ───────────────────────────────────────────────────────────
--
--  Design notes:
--  • license_expiry feeds a scheduled job that alerts ops 30 days before expiry.
--  • national_id is stored but hashed at the app layer for PII compliance.

CREATE TABLE core.drivers (
    driver_id           UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_code       VARCHAR(20)             NOT NULL,
    first_name          VARCHAR(80)             NOT NULL,
    last_name           VARCHAR(80)             NOT NULL,
    phone               VARCHAR(20)             NOT NULL,
    email               VARCHAR(120),
    license_no          VARCHAR(30)             NOT NULL,
    license_expiry      DATE                    NOT NULL,
    status              core.driver_status_t    NOT NULL DEFAULT 'active',
    hired_on            DATE                    NOT NULL DEFAULT CURRENT_DATE,
    created_at          TIMESTAMPTZ             NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ             NOT NULL DEFAULT now(),

    -- ── Constraints ────────────────────────────────────────────────────────
    CONSTRAINT uq_drivers_employee_code   UNIQUE (employee_code),
    CONSTRAINT uq_drivers_license         UNIQUE (license_no),
    CONSTRAINT uq_drivers_email           UNIQUE (email),
    CONSTRAINT ck_drivers_license_expiry  CHECK  (license_expiry > '2000-01-01')
);

COMMENT ON TABLE core.drivers IS 'Driver roster including license and employment status.';


-- ── 2.3  TRIPS ─────────────────────────────────────────────────────────────
--
--  Design notes:
--  • cargo_weight_kg validated against vehicles.capacity_kg in a trigger.
--  • actual_start/end are NULL until the trip transitions to those states.
--  • distance_km populated on completion either by GPS feed or manual entry.
--  • We deliberately avoid storing money in FLOAT — use NUMERIC always.

CREATE TABLE core.trips (
    trip_id             UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id          UUID                    NOT NULL REFERENCES core.vehicles  (vehicle_id),
    driver_id           UUID                    NOT NULL REFERENCES core.drivers   (driver_id),
    status              core.trip_status_t      NOT NULL DEFAULT 'scheduled',

    origin              VARCHAR(200)            NOT NULL,
    destination         VARCHAR(200)            NOT NULL,
    cargo_description   TEXT,
    cargo_weight_kg     NUMERIC(8, 2),

    scheduled_start     TIMESTAMPTZ             NOT NULL,
    scheduled_end       TIMESTAMPTZ             NOT NULL,
    actual_start        TIMESTAMPTZ,
    actual_end          TIMESTAMPTZ,

    distance_km         NUMERIC(10, 2),
    notes               TEXT,
    created_at          TIMESTAMPTZ             NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ             NOT NULL DEFAULT now(),

    -- ── Constraints ────────────────────────────────────────────────────────
    CONSTRAINT ck_trips_schedule_order       CHECK (scheduled_end > scheduled_start),
    CONSTRAINT ck_trips_actual_order         CHECK (actual_end IS NULL OR actual_end > actual_start),
    CONSTRAINT ck_trips_cargo_weight         CHECK (cargo_weight_kg IS NULL OR cargo_weight_kg >= 0),
    CONSTRAINT ck_trips_distance             CHECK (distance_km IS NULL OR distance_km > 0)

    -- NOTE: cargo_weight_kg <= vehicles.capacity_kg is enforced by trigger
    --       (see Section 5) because CHECK constraints cannot reference other tables.
);

COMMENT ON TABLE  core.trips                  IS 'Individual trip records linking vehicle and driver.';
COMMENT ON COLUMN core.trips.cargo_weight_kg  IS 'Must not exceed the assigned vehicles.capacity_kg — enforced by trigger.';


-- ── 2.4  FUEL LOGS ─────────────────────────────────────────────────────────
--
--  Design notes:
--  • Linked to trips (nullable) so fuel consumption can be attributed per trip.
--  • price_per_litre and total_cost are both stored so historical costs survive
--    price changes; total_cost = quantity_litres * price_per_litre enforced
--    by CHECK to detect data entry errors.

CREATE TABLE core.fuel_logs (
    fuel_log_id         UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id          UUID                    NOT NULL REFERENCES core.vehicles (vehicle_id),
    trip_id             UUID                             REFERENCES core.trips    (trip_id),
    logged_at           TIMESTAMPTZ             NOT NULL DEFAULT now(),
    odometer_at_fill    NUMERIC(10, 2)          NOT NULL,
    quantity_litres     NUMERIC(8, 3)           NOT NULL,
    price_per_litre     NUMERIC(8, 4)           NOT NULL,
    total_cost          NUMERIC(10, 2)          NOT NULL,
    fuel_station        VARCHAR(120),
    created_at          TIMESTAMPTZ             NOT NULL DEFAULT now(),

    -- ── Constraints ────────────────────────────────────────────────────────
    CONSTRAINT ck_fuel_quantity         CHECK (quantity_litres > 0),
    CONSTRAINT ck_fuel_price            CHECK (price_per_litre > 0),
    CONSTRAINT ck_fuel_total_cost       CHECK (total_cost > 0),
    CONSTRAINT ck_fuel_odometer         CHECK (odometer_at_fill >= 0),

    -- Derived column guard: allow 1-cent rounding tolerance
    CONSTRAINT ck_fuel_cost_matches     CHECK (
        ABS(total_cost - ROUND(quantity_litres * price_per_litre, 2)) <= 0.01
    )
);

COMMENT ON TABLE core.fuel_logs IS 'Fuel fill-up events per vehicle, optionally linked to a trip.';


-- ── 2.5  MAINTENANCE LOGS ──────────────────────────────────────────────────
--
--  Design notes:
--  • next_service_km enables proactive scheduling alerts.
--  • vendor stores the garage/workshop name for procurement analytics.

CREATE TABLE core.maintenance_logs (
    maintenance_id      UUID                        PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id          UUID                        NOT NULL REFERENCES core.vehicles (vehicle_id),
    maintenance_type    core.maintenance_type_t     NOT NULL,
    description         TEXT                        NOT NULL,
    performed_on        DATE                        NOT NULL DEFAULT CURRENT_DATE,
    odometer_at_service NUMERIC(10, 2)              NOT NULL,
    cost                NUMERIC(10, 2)              NOT NULL,
    vendor              VARCHAR(120),
    next_service_km     NUMERIC(10, 2),
    created_at          TIMESTAMPTZ                 NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ                 NOT NULL DEFAULT now(),

    -- ── Constraints ────────────────────────────────────────────────────────
    CONSTRAINT ck_maintenance_cost              CHECK (cost >= 0),
    CONSTRAINT ck_maintenance_odometer          CHECK (odometer_at_service >= 0),
    CONSTRAINT ck_maintenance_next_service_km   CHECK (next_service_km IS NULL OR next_service_km > odometer_at_service)
);

COMMENT ON TABLE core.maintenance_logs IS 'Service and repair history per vehicle.';


-- ── 2.6  EXPENSES ──────────────────────────────────────────────────────────
--
--  Design notes:
--  • Covers all fleet costs: toll, insurance, salary allocations, etc.
--  • Both vehicle_id and trip_id are nullable — some expenses are fleet-wide.
--  • currency defaults to 'USD'; extend if multi-currency is needed.

CREATE TABLE core.expenses (
    expense_id          UUID                        PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id          UUID                                    REFERENCES core.vehicles (vehicle_id),
    trip_id             UUID                                    REFERENCES core.trips    (trip_id),
    driver_id           UUID                                    REFERENCES core.drivers  (driver_id),
    category            core.expense_category_t     NOT NULL,
    amount              NUMERIC(12, 2)              NOT NULL,
    currency            CHAR(3)                     NOT NULL DEFAULT 'USD',
    incurred_on         DATE                        NOT NULL DEFAULT CURRENT_DATE,
    description         TEXT,
    receipt_ref         VARCHAR(80),   -- external document / receipt ID
    created_at          TIMESTAMPTZ                 NOT NULL DEFAULT now(),

    -- ── Constraints ────────────────────────────────────────────────────────
    CONSTRAINT ck_expenses_amount       CHECK (amount > 0),
    CONSTRAINT ck_expenses_currency     CHECK (currency ~ '^[A-Z]{3}$')
);

COMMENT ON TABLE core.expenses IS 'General ledger for all fleet-related expenditure.';


-- ---------------------------------------------------------------------------
-- 3.  INDEXES
-- ---------------------------------------------------------------------------
-- Rule of thumb:
--   • Index every FK column (PostgreSQL does NOT do this automatically).
--   • Add composite indexes for the most common WHERE + ORDER BY patterns.
--   • Partial indexes reduce index size for selective predicates.

-- vehicles
CREATE INDEX idx_vehicles_status       ON core.vehicles  (status);
CREATE INDEX idx_vehicles_fuel_type    ON core.vehicles  (fuel_type);

-- drivers
CREATE INDEX idx_drivers_status        ON core.drivers   (status);
CREATE INDEX idx_drivers_license_exp   ON core.drivers   (license_expiry);   -- expiry alerts

-- trips  (most query-heavy table)
CREATE INDEX idx_trips_vehicle_id      ON core.trips     (vehicle_id);
CREATE INDEX idx_trips_driver_id       ON core.trips     (driver_id);
CREATE INDEX idx_trips_status          ON core.trips     (status);
CREATE INDEX idx_trips_scheduled_start ON core.trips     (scheduled_start DESC);
CREATE INDEX idx_trips_active          ON core.trips     (status)          -- partial: only active rows
    WHERE status IN ('scheduled', 'in_progress');

-- Composite: driver schedule lookups
CREATE INDEX idx_trips_driver_schedule ON core.trips     (driver_id, scheduled_start DESC);

-- fuel_logs
CREATE INDEX idx_fuel_vehicle_id       ON core.fuel_logs (vehicle_id);
CREATE INDEX idx_fuel_trip_id          ON core.fuel_logs (trip_id);
CREATE INDEX idx_fuel_logged_at        ON core.fuel_logs (logged_at DESC);

-- maintenance_logs
CREATE INDEX idx_maint_vehicle_id      ON core.maintenance_logs (vehicle_id);
CREATE INDEX idx_maint_performed_on    ON core.maintenance_logs (performed_on DESC);

-- expenses
CREATE INDEX idx_exp_vehicle_id        ON core.expenses  (vehicle_id);
CREATE INDEX idx_exp_trip_id           ON core.expenses  (trip_id);
CREATE INDEX idx_exp_driver_id         ON core.expenses  (driver_id);
CREATE INDEX idx_exp_category          ON core.expenses  (category);
CREATE INDEX idx_exp_incurred_on       ON core.expenses  (incurred_on DESC);


-- ---------------------------------------------------------------------------
-- 4.  AUTO-UPDATE updated_at  (trigger function shared across tables)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION core.fn_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_vehicles_updated_at
    BEFORE UPDATE ON core.vehicles
    FOR EACH ROW EXECUTE FUNCTION core.fn_set_updated_at();

CREATE TRIGGER trg_drivers_updated_at
    BEFORE UPDATE ON core.drivers
    FOR EACH ROW EXECUTE FUNCTION core.fn_set_updated_at();

CREATE TRIGGER trg_trips_updated_at
    BEFORE UPDATE ON core.trips
    FOR EACH ROW EXECUTE FUNCTION core.fn_set_updated_at();

CREATE TRIGGER trg_maintenance_updated_at
    BEFORE UPDATE ON core.maintenance_logs
    FOR EACH ROW EXECUTE FUNCTION core.fn_set_updated_at();


-- ---------------------------------------------------------------------------
-- 5.  BUSINESS RULE TRIGGERS
-- ---------------------------------------------------------------------------
-- These rules MUST live in PostgreSQL — not the backend — because:
--   a) They guard data integrity regardless of which service writes the row.
--   b) Direct DB writes (migrations, data imports) still pass validation.
--   c) Application bugs cannot bypass them.

-- ── 5.1  Cargo weight must not exceed vehicle capacity ─────────────────────

CREATE OR REPLACE FUNCTION core.fn_validate_trip_cargo()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE
    v_capacity NUMERIC;
BEGIN
    SELECT capacity_kg
      INTO v_capacity
      FROM core.vehicles
     WHERE vehicle_id = NEW.vehicle_id;

    IF NEW.cargo_weight_kg IS NOT NULL AND NEW.cargo_weight_kg > v_capacity THEN
        RAISE EXCEPTION
            'cargo_weight_kg (%) exceeds vehicle capacity (%) for vehicle %',
            NEW.cargo_weight_kg, v_capacity, NEW.vehicle_id
            USING ERRCODE = 'check_violation';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_trips_validate_cargo
    BEFORE INSERT OR UPDATE ON core.trips
    FOR EACH ROW EXECUTE FUNCTION core.fn_validate_trip_cargo();


-- ── 5.2  Vehicle status machine ────────────────────────────────────────────
--  Allowed transitions:
--    available   → in_trip | under_maintenance
--    in_trip     → available | under_maintenance
--    under_maintenance → available
--    * → decommissioned  (one-way)

CREATE OR REPLACE FUNCTION core.fn_validate_vehicle_status_transition()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
    -- Decommissioned is terminal
    IF OLD.status = 'decommissioned' AND NEW.status <> 'decommissioned' THEN
        RAISE EXCEPTION
            'Vehicle % is decommissioned and cannot change status.', OLD.vehicle_id
            USING ERRCODE = 'invalid_parameter_value';
    END IF;

    -- Guard illegal jumps
    IF OLD.status = 'under_maintenance' AND NEW.status = 'in_trip' THEN
        RAISE EXCEPTION
            'Vehicle must return to "available" before starting a trip.'
            USING ERRCODE = 'invalid_parameter_value';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_vehicles_status_machine
    BEFORE UPDATE OF status ON core.vehicles
    FOR EACH ROW EXECUTE FUNCTION core.fn_validate_vehicle_status_transition();


-- ── 5.3  Odometer update on trip completion ─────────────────────────────────
--  When a trip moves to 'completed' and distance_km is set, advance the
--  vehicle's odometer automatically.

CREATE OR REPLACE FUNCTION core.fn_update_odometer_on_completion()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.status = 'completed'
       AND OLD.status <> 'completed'
       AND NEW.distance_km IS NOT NULL
    THEN
        UPDATE core.vehicles
           SET odometer_km = odometer_km + NEW.distance_km
         WHERE vehicle_id = NEW.vehicle_id;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_trips_odometer_update
    AFTER UPDATE OF status ON core.trips
    FOR EACH ROW EXECUTE FUNCTION core.fn_update_odometer_on_completion();


-- ── 5.4  Driver must be active to be assigned ──────────────────────────────

CREATE OR REPLACE FUNCTION core.fn_validate_driver_active()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE
    v_driver_status core.driver_status_t;
BEGIN
    SELECT status INTO v_driver_status
      FROM core.drivers
     WHERE driver_id = NEW.driver_id;

    IF v_driver_status <> 'active' THEN
        RAISE EXCEPTION
            'Driver % has status "%" and cannot be assigned to a trip.',
            NEW.driver_id, v_driver_status
            USING ERRCODE = 'check_violation';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_trips_driver_active
    BEFORE INSERT ON core.trips
    FOR EACH ROW EXECUTE FUNCTION core.fn_validate_driver_active();


-- ---------------------------------------------------------------------------
-- 6.  ANALYTICS SCHEMA
-- ---------------------------------------------------------------------------
-- Separate schema = separate permission grants.
-- Read-only analytics users get USAGE on analytics, not core.

SET search_path = analytics, core, public;

-- ── 6.1  Fleet Utilisation  ─────────────────────────────────────────────────
--  "Utilisation" = proportion of operational time a vehicle is on a trip.
--  Query window: rolling 30 days.

CREATE OR REPLACE VIEW analytics.v_fleet_utilisation AS
WITH period AS (
    SELECT
        now() - INTERVAL '30 days'  AS window_start,
        now()                       AS window_end,
        30.0 * 24                   AS total_hours     -- 720 hours in the window
),
trip_hours AS (
    SELECT
        t.vehicle_id,
        SUM(
            EXTRACT(EPOCH FROM (
                LEAST(t.actual_end,  p.window_end)   -
                GREATEST(t.actual_start, p.window_start)
            )) / 3600.0
        ) AS hours_in_use
    FROM  core.trips t
    CROSS JOIN period p
    WHERE t.status          = 'completed'
      AND t.actual_start IS NOT NULL
      AND t.actual_end   IS NOT NULL
      AND t.actual_end    > p.window_start
      AND t.actual_start  < p.window_end
    GROUP BY t.vehicle_id
)
SELECT
    v.vehicle_id,
    v.registration_no,
    v.make || ' ' || v.model           AS vehicle_name,
    v.status,
    COALESCE(th.hours_in_use, 0)       AS hours_in_use_30d,
    p.total_hours                      AS window_hours,
    ROUND(
        COALESCE(th.hours_in_use, 0) / NULLIF(p.total_hours, 0) * 100,
        2
    )                                  AS utilisation_pct
FROM  core.vehicles v
CROSS JOIN period p
LEFT  JOIN trip_hours th ON th.vehicle_id = v.vehicle_id
WHERE v.status <> 'decommissioned'
ORDER BY utilisation_pct DESC;

COMMENT ON VIEW analytics.v_fleet_utilisation IS
    'Rolling 30-day vehicle utilisation percentage based on completed trip hours.';


-- ── 6.2  Cost Per Vehicle  ──────────────────────────────────────────────────

CREATE OR REPLACE VIEW analytics.v_cost_per_vehicle AS
SELECT
    v.vehicle_id,
    v.registration_no,
    v.make || ' ' || v.model                               AS vehicle_name,
    COALESCE(SUM(e.amount) FILTER (WHERE e.category = 'fuel'),        0) AS fuel_cost,
    COALESCE(SUM(e.amount) FILTER (WHERE e.category = 'maintenance'), 0) AS maintenance_cost,
    COALESCE(SUM(e.amount) FILTER (WHERE e.category = 'toll'),        0) AS toll_cost,
    COALESCE(SUM(e.amount) FILTER (WHERE e.category = 'insurance'),   0) AS insurance_cost,
    COALESCE(SUM(e.amount), 0)                                           AS total_cost,
    COUNT(DISTINCT t.trip_id)                                            AS total_trips,
    COALESCE(SUM(t.distance_km), 0)                                      AS total_km,
    CASE
        WHEN SUM(t.distance_km) > 0
        THEN ROUND(SUM(e.amount) / SUM(t.distance_km), 4)
        ELSE NULL
    END                                                                  AS cost_per_km
FROM  core.vehicles v
LEFT  JOIN core.expenses    e ON e.vehicle_id = v.vehicle_id
LEFT  JOIN core.trips       t ON t.vehicle_id = v.vehicle_id
                              AND t.status = 'completed'
GROUP BY v.vehicle_id, v.registration_no, v.make, v.model
ORDER BY total_cost DESC;

COMMENT ON VIEW analytics.v_cost_per_vehicle IS
    'All-time cost breakdown and cost-per-km for every vehicle.';


-- ── 6.3  Fuel Efficiency ────────────────────────────────────────────────────
--  Fuel efficiency = km driven per litre consumed.
--  Calculated per vehicle using odometer deltas between consecutive fill-ups.

CREATE OR REPLACE VIEW analytics.v_fuel_efficiency AS
WITH ordered_fills AS (
    SELECT
        vehicle_id,
        logged_at,
        odometer_at_fill,
        quantity_litres,
        LAG(odometer_at_fill) OVER (
            PARTITION BY vehicle_id
            ORDER BY odometer_at_fill
        ) AS prev_odometer
    FROM core.fuel_logs
),
intervals AS (
    SELECT
        vehicle_id,
        (odometer_at_fill - prev_odometer)  AS km_driven,
        quantity_litres
    FROM  ordered_fills
    WHERE prev_odometer IS NOT NULL
      AND (odometer_at_fill - prev_odometer) > 0
)
SELECT
    v.vehicle_id,
    v.registration_no,
    v.make || ' ' || v.model                            AS vehicle_name,
    v.fuel_type,
    COUNT(*)                                            AS fill_up_intervals,
    ROUND(SUM(i.km_driven), 2)                         AS total_km_tracked,
    ROUND(SUM(i.quantity_litres), 3)                   AS total_litres,
    ROUND(SUM(i.km_driven) / NULLIF(SUM(i.quantity_litres), 0), 3) AS km_per_litre,
    ROUND(100.0 / NULLIF(
        SUM(i.km_driven) / NULLIF(SUM(i.quantity_litres), 0), 0
    ), 3)                                              AS litres_per_100km
FROM  intervals i
JOIN  core.vehicles v USING (vehicle_id)
GROUP BY v.vehicle_id, v.registration_no, v.make, v.model, v.fuel_type
ORDER BY km_per_litre DESC;

COMMENT ON VIEW analytics.v_fuel_efficiency IS
    'Fuel efficiency (km/L and L/100km) per vehicle derived from fill-up odometer deltas.';


-- ── 6.4  Active Trips Dashboard ─────────────────────────────────────────────

CREATE OR REPLACE VIEW analytics.v_active_trips_dashboard AS
SELECT
    t.trip_id,
    t.status,
    v.registration_no,
    v.make || ' ' || v.model                        AS vehicle_name,
    d.first_name || ' ' || d.last_name              AS driver_name,
    d.phone                                         AS driver_phone,
    t.origin,
    t.destination,
    t.cargo_description,
    t.cargo_weight_kg,
    t.scheduled_start,
    t.scheduled_end,
    t.actual_start,
    -- how long since the trip started (minutes)
    CASE WHEN t.actual_start IS NOT NULL
         THEN ROUND(EXTRACT(EPOCH FROM now() - t.actual_start) / 60, 0)
    END                                             AS elapsed_minutes,
    -- flag overdue trips
    CASE WHEN t.scheduled_end < now() AND t.status = 'in_progress'
         THEN TRUE ELSE FALSE
    END                                             AS is_overdue
FROM  core.trips   t
JOIN  core.vehicles v ON v.vehicle_id = t.vehicle_id
JOIN  core.drivers  d ON d.driver_id  = t.driver_id
WHERE t.status IN ('scheduled', 'in_progress')
ORDER BY t.scheduled_start ASC;

COMMENT ON VIEW analytics.v_active_trips_dashboard IS
    'Real-time view of all scheduled and in-progress trips with elapsed time and overdue flag.';


-- ── 6.5  Materialized View: Monthly Cost Summary (refresh nightly) ──────────
--  Use a materialized view for expensive aggregations that power reports.
--  Refresh with: REFRESH MATERIALIZED VIEW CONCURRENTLY analytics.mv_monthly_costs;

CREATE MATERIALIZED VIEW analytics.mv_monthly_costs AS
SELECT
    DATE_TRUNC('month', e.incurred_on)::DATE        AS month,
    e.category,
    v.vehicle_id,
    v.registration_no,
    SUM(e.amount)                                   AS total_amount,
    COUNT(*)                                        AS transaction_count
FROM  core.expenses e
JOIN  core.vehicles v ON v.vehicle_id = e.vehicle_id
GROUP BY 1, 2, 3, 4
ORDER BY 1 DESC, total_amount DESC
WITH DATA;

-- Unique index required for CONCURRENTLY refresh
CREATE UNIQUE INDEX idx_mv_monthly_costs_pk
    ON analytics.mv_monthly_costs (month, category, vehicle_id);

COMMENT ON MATERIALIZED VIEW analytics.mv_monthly_costs IS
    'Monthly cost aggregation per vehicle/category. Refresh nightly via pg_cron or cron job.';


-- ---------------------------------------------------------------------------
-- 7.  PERMISSION GRANTS  (role-based; adjust to your IAM structure)
-- ---------------------------------------------------------------------------

-- Application service account: full CRUD on core, read-only on analytics
-- CREATE ROLE fleetflow_app  NOLOGIN;
-- GRANT USAGE                    ON SCHEMA core      TO fleetflow_app;
-- GRANT SELECT, INSERT, UPDATE   ON ALL TABLES IN SCHEMA core      TO fleetflow_app;
-- GRANT USAGE                    ON SCHEMA analytics TO fleetflow_app;
-- GRANT SELECT                   ON ALL TABLES IN SCHEMA analytics  TO fleetflow_app;

-- Reporting / BI service: analytics schema only
-- CREATE ROLE fleetflow_reports NOLOGIN;
-- GRANT USAGE  ON SCHEMA analytics TO fleetflow_reports;
-- GRANT SELECT ON ALL TABLES IN SCHEMA analytics TO fleetflow_reports;


-- ---------------------------------------------------------------------------
-- 8.  QUICK VALIDATION QUERIES  (run after loading seed data)
-- ---------------------------------------------------------------------------

-- 8.1  Schema health: count objects per schema
SELECT schemaname, COUNT(*) AS objects
  FROM pg_tables
 WHERE schemaname IN ('core', 'analytics')
 GROUP BY schemaname;

-- 8.2  Trigger inventory
SELECT trigger_name, event_object_table, event_manipulation
  FROM information_schema.triggers
 WHERE trigger_schema = 'core'
 ORDER BY event_object_table;

-- 8.3  Index inventory
SELECT indexname, tablename
  FROM pg_indexes
 WHERE schemaname = 'core'
 ORDER BY tablename, indexname;


-- =============================================================================
--  END OF FLEETFLOW SCHEMA
-- =============================================================================