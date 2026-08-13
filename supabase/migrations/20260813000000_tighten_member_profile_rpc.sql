-- Tighten member profile writes + ensure visitor is a valid level.
-- Run in the Supabase SQL editor if non-ARIES adds fail or alumni can edit others.

ALTER TABLE public.members
DROP CONSTRAINT IF EXISTS members_level_check;

ALTER TABLE public.members
ADD CONSTRAINT members_level_check
CHECK (level IN (
  'oc',
  'co_overall_coordinator',
  'research_lead',
  'coordinator',
  'executive',
  'member',
  'blogger',
  'alumni',
  'visitor'
));

DROP FUNCTION IF EXISTS public.save_member_profile(text, jsonb);

CREATE OR REPLACE FUNCTION public.save_member_profile(p_slug text, p_data jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller uuid := auth.uid();
  caller_slug text;
  caller_level text;
BEGIN
  SELECT slug, level INTO caller_slug, caller_level
  FROM public.members
  WHERE auth_user_id = caller;

  IF caller IS NULL THEN
    RAISE EXCEPTION 'Not signed in';
  END IF;

  IF caller_slug IS DISTINCT FROM p_slug
     AND caller_level NOT IN ('oc', 'co_overall_coordinator', 'research_lead') THEN
    RAISE EXCEPTION 'Forbidden: you can only edit your own profile';
  END IF;

  INSERT INTO public.members (slug, data, updated_at)
  VALUES (p_slug, p_data, now())
  ON CONFLICT (slug) DO UPDATE
    SET data = excluded.data,
        updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.save_member_profile(text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_member_profile(text, jsonb) TO authenticated;
