-- Migration: Add Profile Views Counter
-- Created At: 2026-05-20
-- Description: Adds a profile_views column to profiles table, updates profiles_public view, and creates a secure RPC function to increment the views bypassing RLS.

-- 1. Add profile_views column to public.profiles if not exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_views INT DEFAULT 0;

-- 2. Update/Recreate the public view profiles_public to include profile_views
CREATE OR REPLACE VIEW public.profiles_public AS
SELECT id,
    numeric_id,
    name,
    avatar_url,
    city,
    bio,
    social,
    role,
    created_at,
    play_styles,
    gallery,
    level,
    current_exp,
    next_level_exp,
    last_daily_claim,
    daily_streak,
    is_vip,
    rank,
    points,
    titles,
    itm,
    vip_status,
    vip_expires_at,
    is_verified,
    total_pending_debt,
    suprema_user_id,
    suprema_nickname,
    profile_views
FROM public.profiles;

-- 3. Create the secure RPC function to safely increment views bypassing RLS (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.increment_profile_views(p_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.profiles
    SET profile_views = COALESCE(profile_views, 0) + 1
    WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Grant execution privileges to anon and authenticated users
GRANT EXECUTE ON FUNCTION public.increment_profile_views(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_profile_views(UUID) TO authenticated;


/*
=========================================
ROLLBACK PROCEDURES (BACKUP / REVERT)
=========================================
If you ever want to revert these database changes completely, run the following SQL:

-- 1. Recreate old view profiles_public without profile_views
CREATE OR REPLACE VIEW public.profiles_public AS
SELECT id,
    numeric_id,
    name,
    avatar_url,
    city,
    bio,
    social,
    role,
    created_at,
    play_styles,
    gallery,
    level,
    current_exp,
    next_level_exp,
    last_daily_claim,
    daily_streak,
    is_vip,
    rank,
    points,
    titles,
    itm,
    vip_status,
    vip_expires_at,
    is_verified,
    total_pending_debt,
    suprema_user_id,
    suprema_nickname
FROM public.profiles;

-- 2. Drop the RPC function
DROP FUNCTION IF EXISTS public.increment_profile_views(UUID);

-- 3. Drop the column from the profiles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS profile_views;
*/
