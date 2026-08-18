-- Own-profile-only writes + public SELECT. App APIs use the service role after
-- session checks; authenticated JWTs must not UPDATE other members via PostgREST.
-- Also stores DevClub OIDC subject for stable account linking.

ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS oauth_sub text;

CREATE UNIQUE INDEX IF NOT EXISTS members_oauth_sub_key
  ON public.members (oauth_sub)
  WHERE oauth_sub IS NOT NULL;

CREATE OR REPLACE FUNCTION public.save_member_profile(p_slug text, p_data jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller uuid := auth.uid();
  caller_slug text;
BEGIN
  IF caller IS NULL THEN
    RAISE EXCEPTION 'Not signed in';
  END IF;

  SELECT slug INTO caller_slug
  FROM public.members
  WHERE auth_user_id = caller;

  IF caller_slug IS NULL OR caller_slug IS DISTINCT FROM p_slug THEN
    RAISE EXCEPTION 'Forbidden: you can only edit your own profile';
  END IF;

  UPDATE public.members
  SET
    data = (COALESCE(p_data, '{}'::jsonb) - 'level' - 'entryNumber' - 'email' - 'auth_user_id')
           || jsonb_build_object('slug', p_slug),
    updated_at = now()
  WHERE slug = p_slug;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.save_member_profile(text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_member_profile(text, jsonb) TO authenticated;

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('members', 'projects', 'events', 'resources', 'team', 'change_requests', 'change_log')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.change_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY members_select_public ON public.members
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY projects_select_public ON public.projects
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY events_select_public ON public.events
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY resources_select_public ON public.resources
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY team_select_public ON public.team
  FOR SELECT TO anon, authenticated USING (true);

-- Anon/authenticated can read public profile JSON, not Kerberos, emails, or auth ids.
REVOKE ALL ON public.members FROM anon, authenticated;
GRANT SELECT (slug, data, level) ON public.members TO anon, authenticated;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON
  public.projects, public.events, public.resources, public.team
  FROM anon, authenticated;
GRANT SELECT ON public.projects, public.events, public.resources, public.team
  TO anon, authenticated;

REVOKE ALL ON public.change_requests, public.change_log FROM anon, authenticated;

-- Storage: public read of media; uploads go through /api/admin/upload (service role).
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND (
        policyname ILIKE '%media%'
        OR COALESCE(qual, '') ILIKE '%media%'
        OR COALESCE(with_check, '') ILIKE '%media%'
        OR (
          cmd IN ('INSERT', 'UPDATE', 'DELETE', 'ALL')
          AND COALESCE(qual, 'true') IN ('true', '(true)')
        )
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname);
  END LOOP;
END $$;

DROP POLICY IF EXISTS media_select_public ON storage.objects;

CREATE POLICY media_select_public ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'media');
