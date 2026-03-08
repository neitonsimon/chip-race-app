-- Update payment_intents to cascade on delete
ALTER TABLE IF EXISTS public.payment_intents
  DROP CONSTRAINT IF EXISTS payment_intents_user_id_fkey,
  ADD CONSTRAINT payment_intents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Also let's just make sure withdrawal_requests cascades
ALTER TABLE IF EXISTS public.withdrawal_requests
  DROP CONSTRAINT IF EXISTS withdrawal_requests_user_id_fkey,
  ADD CONSTRAINT withdrawal_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.poll_votes
  DROP CONSTRAINT IF EXISTS poll_votes_user_id_fkey,
  ADD CONSTRAINT poll_votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.user_badges
  DROP CONSTRAINT IF EXISTS user_badges_user_id_fkey,
  ADD CONSTRAINT user_badges_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.page_views
  DROP CONSTRAINT IF EXISTS page_views_user_id_fkey,
  ADD CONSTRAINT page_views_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
