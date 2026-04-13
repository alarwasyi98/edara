-- =============================================================================
-- EDARA Custom Migration: RLS Policies & Database Constraints
-- =============================================================================
--
-- This migration is a TRACKED CUSTOM MIGRATION generated via:
--   drizzle-kit generate --custom --name=rls_and_constraints
--
-- It is applied automatically by `pnpm db:migrate` (NOT via manual Neon Console push).
--
-- Contains:
--   Part A: Enable Row Level Security on all operational tables
--   Part B: Tenant isolation policies (school_id)
--   Part C: Unit isolation policies with super_admin bypass
--   Part D: Partial unique index for academic years (Business Rule B1)
--   Part E: Financial immutability constraints (ADR-04)
--
-- SQL Escape Hatch: This file contains DDL that cannot be expressed
-- in Drizzle ORM's schema API (partial unique indexes, RLS policies).
-- See: src/docs/reconciliation-log.md for decision documentation.
--
-- @see technical-specification.md §4.2 (L1247-L1280)
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- Part A: Enable Row Level Security
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE school_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollment_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_payment_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashflow_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashflow_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- Part B: Tenant Isolation Policies (school_id)
--
-- Every row is visible only when app.current_school matches school_id.
-- set_config('app.current_school', <uuid>, true) is called within
-- db.transaction() — NEVER as global context (Decision #3).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE POLICY tenant_isolation ON school_units
  USING (school_id = current_setting('app.current_school')::uuid);

CREATE POLICY tenant_isolation ON academic_years
  USING (school_id = current_setting('app.current_school')::uuid);

CREATE POLICY tenant_isolation ON teachers
  USING (school_id = current_setting('app.current_school')::uuid);

CREATE POLICY tenant_isolation ON students
  USING (school_id = current_setting('app.current_school')::uuid);

CREATE POLICY tenant_isolation ON classes
  USING (school_id = current_setting('app.current_school')::uuid);

CREATE POLICY tenant_isolation ON enrollments
  USING (school_id = current_setting('app.current_school')::uuid);

CREATE POLICY tenant_isolation ON enrollment_status_history
  USING (enrollment_id IN (
    SELECT id FROM enrollments
    WHERE school_id = current_setting('app.current_school')::uuid
  ));

CREATE POLICY tenant_isolation ON payment_categories
  USING (school_id = current_setting('app.current_school')::uuid);

CREATE POLICY tenant_isolation ON class_payment_rates
  USING (school_id = current_setting('app.current_school')::uuid);

CREATE POLICY tenant_isolation ON discount_schemes
  USING (school_id = current_setting('app.current_school')::uuid);

CREATE POLICY tenant_isolation ON payment_bills
  USING (school_id = current_setting('app.current_school')::uuid);

CREATE POLICY tenant_isolation ON payment_transactions
  USING (school_id = current_setting('app.current_school')::uuid);

CREATE POLICY tenant_isolation ON cashflow_categories
  USING (school_id = current_setting('app.current_school')::uuid);

CREATE POLICY tenant_isolation ON cashflow_transactions
  USING (school_id = current_setting('app.current_school')::uuid);

CREATE POLICY tenant_isolation ON school_events
  USING (school_id = current_setting('app.current_school')::uuid);

CREATE POLICY tenant_isolation ON activity_logs
  USING (school_id = current_setting('app.current_school')::uuid);

-- ─────────────────────────────────────────────────────────────────────────────
-- Part C: Unit Isolation Policies (with super_admin bypass)
--
-- Tables with unit_id get an additional unit-level policy.
-- super_admin bypasses unit isolation (operates at school-wide level).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE POLICY unit_isolation ON school_units
  USING (
    id = current_setting('app.current_unit', true)::uuid
    OR current_setting('app.user_role', true) = 'super_admin'
  );

CREATE POLICY unit_isolation ON academic_years
  USING (
    unit_id = current_setting('app.current_unit', true)::uuid
    OR current_setting('app.user_role', true) = 'super_admin'
  );

CREATE POLICY unit_isolation ON teachers
  USING (
    unit_id = current_setting('app.current_unit', true)::uuid
    OR current_setting('app.user_role', true) = 'super_admin'
  );

CREATE POLICY unit_isolation ON students
  USING (
    unit_id = current_setting('app.current_unit', true)::uuid
    OR current_setting('app.user_role', true) = 'super_admin'
  );

CREATE POLICY unit_isolation ON classes
  USING (
    unit_id = current_setting('app.current_unit', true)::uuid
    OR current_setting('app.user_role', true) = 'super_admin'
  );

CREATE POLICY unit_isolation ON enrollments
  USING (
    unit_id = current_setting('app.current_unit', true)::uuid
    OR current_setting('app.user_role', true) = 'super_admin'
  );

CREATE POLICY unit_isolation ON payment_categories
  USING (
    unit_id = current_setting('app.current_unit', true)::uuid
    OR current_setting('app.user_role', true) = 'super_admin'
  );

CREATE POLICY unit_isolation ON cashflow_categories
  USING (
    unit_id = current_setting('app.current_unit', true)::uuid
    OR current_setting('app.user_role', true) = 'super_admin'
  );

CREATE POLICY unit_isolation ON cashflow_transactions
  USING (
    unit_id = current_setting('app.current_unit', true)::uuid
    OR current_setting('app.user_role', true) = 'super_admin'
  );

CREATE POLICY unit_isolation ON school_events
  USING (
    unit_id = current_setting('app.current_unit', true)::uuid
    OR current_setting('app.user_role', true) = 'super_admin'
  );

CREATE POLICY unit_isolation ON activity_logs
  USING (
    unit_id = current_setting('app.current_unit', true)::uuid
    OR current_setting('app.user_role', true) = 'super_admin'
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- Part D: Partial Unique Index — Academic Year Singleton (Business Rule B1)
--
-- SQL ESCAPE HATCH: Drizzle ORM does not support CREATE UNIQUE INDEX ... WHERE.
-- This ensures only one active academic year per unit at any time.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE UNIQUE INDEX academic_years_one_active_per_unit
  ON academic_years (unit_id)
  WHERE is_active = TRUE;

-- ─────────────────────────────────────────────────────────────────────────────
-- Part E: Financial Immutability (ADR-04)
--
-- Prevent UPDATE and DELETE on payment_transactions at database level.
-- NOTE: This requires a dedicated DB role (e.g. 'edara_app') for the
-- application connection. If using the default Neon role, adjust the
-- role name accordingly. Commented out until role setup is confirmed.
-- ─────────────────────────────────────────────────────────────────────────────

-- TODO: Uncomment after confirming the application DB role name
-- REVOKE UPDATE, DELETE ON payment_transactions FROM edara_app;