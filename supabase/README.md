-- ARIES_Website schema snapshot.
-- Source of truth is the live Supabase project lkhansubwrevcvsatcuc.
-- Re-seed content: npm run db:seed:supabase (needs SUPABASE_SERVICE_ROLE_KEY)

-- members/projects/events/resources/team + change_requests/change_log
-- Levels: oc | co_overall_coordinator | research_lead | coordinator | executive | member | blogger | alumni | visitor
-- Login: DevClub OIDC (auth.devclub.in) maps kerberos → members row.
-- Staff dual-run: username/password via resolve_login_email. No default bootstrap password.
-- Apply RLS: supabase/migrations/20260814000000_own_profile_rls.sql
