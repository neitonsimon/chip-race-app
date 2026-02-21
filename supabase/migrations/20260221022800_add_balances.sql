-- Add balance_brl and balance_chipz columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN balance_brl NUMERIC(10,2) DEFAULT 0.00,
ADD COLUMN balance_chipz INTEGER DEFAULT 0;
