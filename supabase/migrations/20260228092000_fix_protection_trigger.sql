
-- Migration: Fix sensitive column protection and secure balance transactions
-- Description: Refines the protect_sensitive_profile_fields trigger to be more robust and handles cases where auth.uid() might be tricky in RPC contexts.
-- Also ensures that 'admin' and 'service_role' can always bypass these protections.

BEGIN;

-- 🛡️ 1. Robust Role Check Function
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS TEXT AS $$
DECLARE
    v_role TEXT;
BEGIN
    -- Try to get role from JWT claims
    v_role := (current_setting('request.jwt.claims', true)::jsonb ->> 'role');
    
    -- If no JWT (like internal Supabase calls), check if we are service_role
    IF v_role IS NULL THEN
        IF current_setting('role', true) = 'service_role' THEN
            v_role := 'service_role';
        END IF;
    END IF;
    
    RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 🛡️ 2. Update the Protection Trigger
CREATE OR REPLACE FUNCTION public.protect_sensitive_profile_fields()
RETURNS TRIGGER AS $$
DECLARE
    v_caller_auth_role TEXT;
    v_caller_profile_role TEXT;
BEGIN
    -- Get role from JWT
    v_caller_auth_role := public.get_auth_role();
    
    -- If it's a service role, allow everything
    IF v_caller_auth_role = 'service_role' THEN
        RETURN NEW;
    END IF;

    -- Check if it's an admin via profiles table (if uid exists)
    IF auth.uid() IS NOT NULL THEN
        SELECT role INTO v_caller_profile_role FROM public.profiles WHERE id = auth.uid();
        
        -- If the caller is an admin, let them do anything
        IF v_caller_profile_role = 'admin' THEN
            RETURN NEW;
        END IF;

        -- ALSO: If the user is updating their own profile, they can change non-sensitive fields.
        -- We already have specific policies for WHAT row they can update.
        -- Here we only care about BLOCKING specific columns for non-admins.
        
        IF (NEW.balance_brl IS DISTINCT FROM OLD.balance_brl) OR
           (NEW.balance_chipz IS DISTINCT FROM OLD.balance_chipz) OR
           (NEW.role IS DISTINCT FROM OLD.role) OR
           (NEW.debt_limit_brl IS DISTINCT FROM OLD.debt_limit_brl) OR
           (NEW.total_pending_debt IS DISTINCT FROM OLD.total_pending_debt) THEN
           
            -- REVERT SENSITIVE FIELDS
            NEW.balance_brl := OLD.balance_brl;
            NEW.balance_chipz := OLD.balance_chipz;
            NEW.role := OLD.role;
            NEW.debt_limit_brl := OLD.debt_limit_brl;
            NEW.total_pending_debt := OLD.total_pending_debt;
            
            -- Optional: Log attempt or raise warning? 
            -- For now, just silently revert to match current behavior but with better logic.
        END IF;
    ELSE
        -- No authenticated user? Revert everything just in case.
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

-- Re-apply trigger to ensure it uses the new function
DROP TRIGGER IF EXISTS trg_protect_sensitive_profile_fields ON public.profiles;
CREATE TRIGGER trg_protect_sensitive_profile_fields
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_sensitive_profile_fields();

COMMIT;
