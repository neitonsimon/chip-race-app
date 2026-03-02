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

  -- Handle badges logic to prevent duplicate templates for the same user
  UPDATE public.user_badges 
  SET user_id = p_new_id 
  WHERE user_id = p_old_id
    AND badge_template_id NOT IN (
      SELECT badge_template_id FROM public.user_badges WHERE user_id = p_new_id
    );
  DELETE FROM public.user_badges WHERE user_id = p_old_id;

  -- Merge balances and debts into the new profile
  UPDATE public.profiles
  SET balance_brl = (v_new_profile.balance_brl + COALESCE(v_old_profile.balance_brl, 0)),
      balance_chipz = (v_new_profile.balance_chipz + COALESCE(v_old_profile.balance_chipz, 0)),
      total_pending_debt = (v_new_profile.total_pending_debt + COALESCE(v_old_profile.total_pending_debt, 0)),
      current_exp = (v_new_profile.current_exp + COALESCE(v_old_profile.current_exp, 0))
  WHERE id = p_new_id;

  -- Attempt to delete the old profile explicitly
  DELETE FROM public.profiles WHERE id = p_old_id;

  RETURN json_build_object('success', true, 'message', 'Contas mescladas com sucesso.');
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;
