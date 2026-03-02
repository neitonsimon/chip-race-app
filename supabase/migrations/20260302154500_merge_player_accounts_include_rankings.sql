CREATE OR REPLACE FUNCTION public.merge_player_accounts(p_old_id uuid, p_new_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old_profile record;
  v_new_profile record;
BEGIN
  -- Validate inputs
  IF p_old_id = p_new_id THEN
    RETURN json_build_object('success', false, 'error', 'Cannot merge an account with itself.');
  END IF;

  SELECT * INTO v_old_profile FROM public.profiles WHERE id = p_old_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Old profile not found.');
  END IF;

  SELECT * INTO v_new_profile FROM public.profiles WHERE id = p_new_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'New profile not found.');
  END IF;

  -- Migrate tables referencing user_id
  UPDATE public.commands SET user_id = p_new_id WHERE user_id = p_old_id;
  UPDATE public.commands SET opened_by = p_new_id WHERE opened_by = p_old_id;
  UPDATE public.command_items SET created_by = p_new_id WHERE created_by = p_old_id;
  UPDATE public.debts SET user_id = p_new_id WHERE user_id = p_old_id;
  UPDATE public.transactions SET user_id = p_new_id WHERE user_id = p_old_id;
  
  -- Messages Table
  UPDATE public.messages SET user_id = p_new_id WHERE user_id = p_old_id;
  UPDATE public.messages SET sender_id = p_new_id WHERE sender_id = p_old_id;
  
  -- Miscellaneous Tables
  UPDATE public.online_credit_requests SET user_id = p_new_id WHERE user_id = p_old_id;
  UPDATE public.tournament_reservations SET user_id = p_new_id WHERE user_id = p_old_id;
  UPDATE public.the_chosen_qualifiers SET user_id = p_new_id WHERE user_id = p_old_id;
  UPDATE public.poll_votes SET user_id = p_new_id WHERE user_id = p_old_id;

  -- Handle badges logic to prevent duplicate templates for the same user
  UPDATE public.user_badges 
  SET user_id = p_new_id 
  WHERE user_id = p_old_id
    AND badge_template_id NOT IN (
      SELECT badge_template_id FROM public.user_badges WHERE user_id = p_new_id
    );
  DELETE FROM public.user_badges WHERE user_id = p_old_id;

  -- ==========================================
  -- REPOSITÓRIO DE RANKING & RESULTADOS
  -- ==========================================
  -- 1. Merge the dynamic rankings table (ranking_players)
  -- Add points to existing rows if the new player is already in that ranking
  UPDATE public.ranking_players rp
  SET points = rp.points + (SELECT points FROM public.ranking_players op WHERE op.player_id = p_old_id AND op.ranking_id = rp.ranking_id)
  WHERE rp.player_id = p_new_id
    AND EXISTS (SELECT 1 FROM public.ranking_players op WHERE op.player_id = p_old_id AND op.ranking_id = rp.ranking_id);

  -- Delete the old rows that were just merged into the new rows
  DELETE FROM public.ranking_players 
  WHERE player_id = p_old_id 
    AND ranking_id IN (SELECT ranking_id FROM public.ranking_players WHERE player_id = p_new_id);

  -- Now that conflicts are resolved, simply change player_id for the remaining rankings
  UPDATE public.ranking_players SET player_id = p_new_id WHERE player_id = p_old_id;

  -- 2. Update JSON results in Events Table
  -- Updates any event where the old user ID is inside the results JSONB array.
  UPDATE public.events
  SET results = (
      SELECT jsonb_agg(
          CASE 
              WHEN elem->>'userId' = p_old_id::text THEN jsonb_set(elem, '{userId}', to_jsonb(p_new_id::text))
              ELSE elem
          END
      )
      FROM jsonb_array_elements(results) elem
  )
  WHERE results::text LIKE '%' || p_old_id::text || '%';

  -- ==========================================
  -- MERGE BALANCES, EXP, AND PROFILE STATS
  -- ==========================================
  UPDATE public.profiles
  SET balance_brl = (v_new_profile.balance_brl + COALESCE(v_old_profile.balance_brl, 0)),
      balance_chipz = (v_new_profile.balance_chipz + COALESCE(v_old_profile.balance_chipz, 0)),
      total_pending_debt = (v_new_profile.total_pending_debt + COALESCE(v_old_profile.total_pending_debt, 0)),
      current_exp = (v_new_profile.current_exp + COALESCE(v_old_profile.current_exp, 0)),
      points = (v_new_profile.points + COALESCE(v_old_profile.points, 0)),
      titles = (v_new_profile.titles + COALESCE(v_old_profile.titles, 0))
  WHERE id = p_new_id;

  -- Attempt to delete the old profile explicitly
  DELETE FROM public.profiles WHERE id = p_old_id;

  RETURN json_build_object('success', true, 'message', 'Contas e Rankings mesclados com sucesso.');
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;
