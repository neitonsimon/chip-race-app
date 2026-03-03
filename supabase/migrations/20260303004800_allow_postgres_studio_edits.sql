-- Migration: Allow Supabase Dashboard (postgres role) to edit sensitive fields
-- Description: Updates the protect_sensitive_profile_fields trigger and get_auth_role function to recognize the postgres superuser used by the Supabase Studio dashboard.

BEGIN;

CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS TEXT AS $$
DECLARE
    v_role TEXT;
    v_db_role TEXT;
BEGIN
    -- Try to get role from JWT claims
    v_role := (current_setting('request.jwt.claims', true)::jsonb ->> 'role');
    
    -- Get current database role/user
    v_db_role := current_user;

    -- If no JWT (like internal Supabase calls or Dashboard edits)
    IF v_role IS NULL THEN
        -- Allow service_role, postgres (dashboard), or supabase_admin
        IF v_db_role IN ('service_role', 'postgres', 'supabase_admin', 'authenticated', 'anon') THEN
             -- usually anon and authenticated should have jwt.
             IF current_setting('role', true) = 'service_role' THEN v_role := 'service_role'; END IF;
        END IF;
        
        -- Override if superusers
        IF v_db_role IN ('postgres', 'service_role', 'supabase_admin') THEN
            v_role := v_db_role;
        END IF;
    END IF;
    
    RETURN coalesce(v_role, 'unknown');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION public.protect_sensitive_profile_fields()
RETURNS TRIGGER AS $$
DECLARE
    v_caller_auth_role TEXT;
    v_caller_profile_role TEXT;
BEGIN
    -- Get role from JWT or system user
    v_caller_auth_role := public.get_auth_role();
    
    -- If it's a superuser or service role, allow everything to be modified directly
    IF v_caller_auth_role IN ('service_role', 'postgres', 'supabase_admin') THEN
        RETURN NEW;
    END IF;

    -- Check if it's an admin via profiles table (if uid exists)
    IF auth.uid() IS NOT NULL THEN
        SELECT role INTO v_caller_profile_role FROM public.profiles WHERE id = auth.uid();
        
        -- If the caller is an admin, let them do anything
        IF v_caller_profile_role = 'admin' THEN
            RETURN NEW;
        END IF;

        -- For regular users, revert sensitive fields
        IF (NEW.balance_brl IS DISTINCT FROM OLD.balance_brl) OR
           (NEW.balance_chipz IS DISTINCT FROM OLD.balance_chipz) OR
           (NEW.role IS DISTINCT FROM OLD.role) OR
           (NEW.debt_limit_brl IS DISTINCT FROM OLD.debt_limit_brl) OR
           (NEW.total_pending_debt IS DISTINCT FROM OLD.total_pending_debt) THEN
           
            NEW.balance_brl := OLD.balance_brl;
            NEW.balance_chipz := OLD.balance_chipz;
            NEW.role := OLD.role;
            NEW.debt_limit_brl := OLD.debt_limit_brl;
            NEW.total_pending_debt := OLD.total_pending_debt;
        END IF;
    ELSE
        -- No authenticated user and not a superuser? Revert everything just in case.
        NEW.balance_brl := OLD.balance_brl;
        NEW.balance_chipz := OLD.balance_chipz;
        NEW.role := OLD.role;
        NEW.debt_limit_brl := OLD.debt_limit_brl;
    END IF;

    -- Safety: Never let non-admins change their own ID or email accidentally if trigger is misconfigured
    IF auth.uid() IS NOT NULL AND v_caller_profile_role IS DISTINCT FROM 'admin' THEN
        NEW.id := OLD.id;
        NEW.email := OLD.email;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
