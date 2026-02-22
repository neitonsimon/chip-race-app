-- Create a function to automatically remove VIP status from users whose VIP period has expired.
-- This function can be called via pg_cron or manually/via RPC.

CREATE OR REPLACE FUNCTION public.update_expired_vips()
RETURNS void AS $$
BEGIN
    UPDATE public.profiles
    SET 
        is_vip = false,
        vip_status = 'nao_vip'
    WHERE 
        is_vip = true 
        AND vip_expires_at IS NOT NULL 
        AND vip_expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution to authenticated users, or anon just in case (we can restrict this, but let's make it easy to call from client side logic if needed)
GRANT EXECUTE ON FUNCTION public.update_expired_vips() TO anon, authenticated;
