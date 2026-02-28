
-- Daily Login System RPC
-- This function handles the streak calculation and reward awarding in a single transaction

CREATE OR REPLACE FUNCTION process_daily_login(u_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    last_claim TIMESTAMPTZ;
    current_gaming_day_start TIMESTAMPTZ;
    streak INT;
    reward_row RECORD;
    v_reward_type TEXT;
    v_reward_value TEXT;
    v_reward_label TEXT;
    
    -- For XP logic
    v_new_exp INT;
    v_current_level INT;
    v_next_lvl_req INT;
    v_new_credit_limit INT;
BEGIN
    -- 1. Determine the start of the current "Gaming Day" (resets at 21h)
    -- If current time is >= 21:00, the gaming day started today at 21:00.
    -- If current time is < 21:00, the gaming day started yesterday at 21:00.
    IF EXTRACT(HOUR FROM (NOW() AT TIME ZONE 'America/Sao_Paulo')) >= 21 THEN
        current_gaming_day_start := (date_trunc('day', NOW() AT TIME ZONE 'America/Sao_Paulo') + INTERVAL '21 hours')::TIMESTAMPTZ;
    ELSE
        current_gaming_day_start := (date_trunc('day', NOW() AT TIME ZONE 'America/Sao_Paulo') - INTERVAL '1 day' + INTERVAL '21 hours')::TIMESTAMPTZ;
    END IF;

    -- 2. Get user's current status
    SELECT last_daily_claim, daily_streak, level INTO last_claim, streak, v_current_level FROM profiles WHERE id = u_id;

    -- 3. Check if already claimed in this gaming day cycle
    IF last_claim IS NOT NULL AND last_claim >= current_gaming_day_start THEN
        RETURN jsonb_build_object(
            'status', 'already_claimed', 
            'message', 'Você já resgatou sua recompensa hoje!',
            'streak', streak
        );
    END IF;

    -- 4. Calculate new streak
    -- If last claim was more than 1 gaming day cycle ago, reset or maintain?
    -- Standard streak: if you miss a cycle, it resets to 1.
    -- Cycle length is 24h. If last_claim < (current_gaming_day_start - INTERVAL '24 hours'), streak resets.
    IF last_claim IS NULL OR last_claim < (current_gaming_day_start - INTERVAL '24 hours') THEN
        streak := 1;
    ELSE
        streak := streak + 1;
    END IF;

    -- 5. Get the reward for the current streak day
    -- We loop back within the configured rewards count
    SELECT * INTO reward_row FROM daily_rewards 
    WHERE day = ((streak - 1) % (SELECT GREATEST(COUNT(*), 1) FROM daily_rewards)) + 1;
    
    IF NOT FOUND THEN
        -- Fallback if table is empty
        UPDATE profiles SET last_daily_claim = NOW(), daily_streak = streak WHERE id = u_id;
        RETURN jsonb_build_object('status', 'success', 'streak', streak, 'reward_label', 'Sem recompensa configurada');
    END IF;

    v_reward_type := reward_row.reward_type;
    v_reward_value := reward_row.reward_value;
    v_reward_label := reward_row.reward_label;

    -- 6. Award Reward based on Type
    CASE v_reward_type
        WHEN 'xp' THEN
            -- Update XP
            UPDATE profiles SET current_exp = current_exp + v_reward_value::INT 
            WHERE id = u_id 
            RETURNING current_exp INTO v_new_exp;
            
            -- Check for level up (Multiple levels at once possible)
            LOOP
                SELECT required_exp, credit_limit INTO v_next_lvl_req, v_new_credit_limit 
                FROM experience_levels 
                WHERE level = v_current_level + 1;
                
                EXIT WHEN v_next_lvl_req IS NULL OR v_new_exp < v_next_lvl_req;
                
                v_current_level := v_current_level + 1;
                UPDATE profiles SET level = v_current_level, debt_limit_brl = v_new_credit_limit WHERE id = u_id;
            END LOOP;
            
        WHEN 'chipz' THEN
            UPDATE profiles SET balance_chipz = balance_chipz + v_reward_value::INT WHERE id = u_id;
            
        WHEN 'brl' THEN
            UPDATE profiles SET balance_brl = balance_brl + v_reward_value::NUMERIC WHERE id = u_id;
            
        WHEN 'badge' THEN
            -- Award insignia
            INSERT INTO user_badges (user_id, badge_template_id, awarded_at)
            VALUES (u_id, v_reward_value::UUID, NOW())
            ON CONFLICT DO NOTHING;
            
        ELSE
            -- Unknown type, do nothing but log or handle as needed
    END CASE;

    -- 7. Record the claim
    UPDATE profiles SET last_daily_claim = NOW(), daily_streak = streak WHERE id = u_id;

    RETURN jsonb_build_object(
        'status', 'success', 
        'streak', streak, 
        'reward_label', v_reward_label,
        'reward_type', v_reward_type,
        'reward_value', v_reward_value
    );
END;
$$;
