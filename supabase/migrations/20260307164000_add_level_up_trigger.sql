-- Migration: Add automatic level-up trigger
-- Description: Creates a trigger to automatically handle level-ups and update next_level_exp when current_exp increases in the profiles table.

BEGIN;

-- 1. Function to handle level up check and updates
CREATE OR REPLACE FUNCTION public.check_level_up_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_next_lvl_req INT;
    v_new_credit_limit INT;
    v_current_lvl INT;
    v_current_exp INT;
BEGIN
    v_current_lvl := NEW.level;
    v_current_exp := NEW.current_exp;

    -- If exp didn't change and wasn't manually set to something lower, we might still want to check
    -- but usually this trigger is for INCREASES.
    -- We use a loop to handle multiple level-ups at once (e.g. huge EXP influx)
    LOOP
        SELECT required_exp, credit_limit INTO v_next_lvl_req, v_new_credit_limit 
        FROM public.experience_levels 
        WHERE level = v_current_lvl + 1;
        
        -- Exit if no more levels or current exp is not enough for next level
        EXIT WHEN v_next_lvl_req IS NULL OR v_current_exp < v_next_lvl_req;
        
        -- Level up!
        v_current_lvl := v_current_lvl + 1;
        NEW.level := v_current_lvl;
        NEW.debt_limit_brl := v_new_credit_limit;
    END LOOP;

    -- Update next_level_exp based on the final level reached
    SELECT required_exp INTO v_next_lvl_req 
    FROM public.experience_levels 
    WHERE level = v_current_lvl + 1;
    
    NEW.next_level_exp := COALESCE(v_next_lvl_req, NEW.next_level_exp);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger
DROP TRIGGER IF EXISTS tr_check_level_up ON public.profiles;
CREATE TRIGGER tr_check_level_up
    BEFORE UPDATE OF current_exp ON public.profiles
    FOR EACH ROW
    WHEN (NEW.current_exp IS DISTINCT FROM OLD.current_exp)
    EXECUTE FUNCTION public.check_level_up_trigger();

-- 3. Update existing next_level_exp for all profiles
UPDATE public.profiles p
SET next_level_exp = (
    SELECT required_exp 
    FROM public.experience_levels 
    WHERE level = p.level + 1
)
WHERE next_level_exp IS NULL;

COMMIT;
