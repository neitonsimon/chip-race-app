-- Migration: Fix events deletions (ON DELETE CASCADE)
-- Description: Updates the foreign key constraints that point to the events table to automatically delete related commands when an event is deleted.

-- 1. Commands table
ALTER TABLE public.commands
  DROP CONSTRAINT IF EXISTS commands_event_id_fkey;

ALTER TABLE public.commands
  ADD CONSTRAINT commands_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

-- Also ensuring final_event_id if it exists
ALTER TABLE public.events
  DROP CONSTRAINT IF EXISTS events_final_event_id_fkey;

ALTER TABLE public.events
  ADD CONSTRAINT events_final_event_id_fkey FOREIGN KEY (final_event_id) REFERENCES public.events(id) ON DELETE SET NULL;
