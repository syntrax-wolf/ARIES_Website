# Spec: Astro site on Cloudflare, gated club editor

**Status:** implemented (tickets 01–18 done). The live app is Astro on Cloudflare Workers in `web/`.

Parent conversation: migrate off Supabase/Next, stay on Workers Free, keep the club editor.

## Problem Statement

The live site is a Next.js app talking to Supabase (Postgres, Auth, Storage) and a second CMS (Sanity) for blogs. Public pages still run session middleware. That is slow, costs money we do not want to spend, and splits editing across three systems. Club access is also too open: any Member can sign in. We want a public site that is static and free to serve, one editor, IIT Delhi login only for people we name, and a single Admin password as fallback.

## Solution

Rebuild the public site in Astro and prerender it to Cloudflare Workers static assets. Keep the existing React editor as islands. Store records in D1 and Media in R2. The Gate allows a Session only for Kerberos ids on the Allowlist, or the bootstrap Admin password. Inside the Gate, Level and Listed rules stay. Chrome is optimized at build; Media is resized in the browser then stored on R2. Publishing a Change Request or a direct save triggers a rebuild so visitors never hit a Worker. Sanity goes away; those posts become Resources.

## User Stories

1. As a visitor, I want the landing page with no login, so that I can see what ARIES is.
2. As a visitor, I want a projects list I can search and filter, so that I can find work that interests me.
3. As a visitor, I want a project detail page, so that I can read about a Project and its Contributors.
4. As a visitor, I want upcoming and past Events, so that I can decide what to attend.
5. As a visitor, I want an Event detail page, so that I can see time, venue, and write-up.
6. As a visitor, I want the team page with Team Years and Alumni, so that I can see who runs the club.
7. As a visitor, I want a Member Profile, so that I can learn about a person.
8. As a visitor, I want Resources (including former Sanity posts), so that I can read blogs and tutorials.
9. As a visitor, I want a contact page that opens mail to the club, so that I can reach ARIES.
10. As a visitor, I want the site to stay fast on a phone, so that I am not waiting on a Worker.
11. As a visitor, I want Chrome images to be light, so that the first paint is quick.
12. As a visitor, I want Media on cards to be already-small WebP, so that galleries do not stall.
13. As someone with IIT Delhi login who is not on the Allowlist, I want sign-in to fail clearly, so that I know I cannot use the editor.
14. As someone not in the club, I want no way to create a password account, so that the editor cannot be self-served.
15. As the bootstrap Admin, I want a hidden email/password login, so that we can recover access if DevClub is down.
16. As Admin, I want that password login to be the only one, so that Members cannot mint accounts.
17. As a Kerberos on the Allowlist, I want to sign in with DevClub, so that I do not manage another password.
18. As Leadership, I want to add and remove Kerberos ids on the Allowlist, so that we control who may pass the Gate.
19. As Leadership, I want to edit the Roster without wiping Profile Blocks, so that identity stays correct.
20. As Leadership, I want to edit any Project or Event, so that we can fix public pages.
21. As Leadership, I want to manage Team Year photos and Alumni, so that the team page stays current.
22. As Leadership, I want to review Change Requests, so that Executive work is checked before it is public.
23. As a Coordinator Listed on a Project, I want to publish edits to that Project, so that I do not wait on Leadership.
24. As a Coordinator not Listed on a Project, I want save to be refused, so that I cannot change others’ work.
25. As an Executive Listed on an Event, I want my edit to become a Change Request, so that Leadership can approve it.
26. As an Executive, I want to request to join a Project as Contributor, so that I can later edit it.
27. As a Blogger, I want to publish Resources only, so that I cannot touch Projects or Events.
28. As someone with a Session, I want to edit my own Profile Blocks, so that my page stays mine.
29. As someone with a Session, I want not to be able to edit another Member’s Profile Blocks, so that pages stay owned.
30. As Leadership, I want to edit another Member’s Profile when needed, so that we can fix content for people not on the Allowlist.
31. As an editor, I want to upload a photo and have it resized in the browser, so that we never transcode on the Worker.
32. As an editor, I want to upload a short clip to Media, so that Event and Project pages can show video.
33. As an editor, I want a Change Log for direct publishes, so that we can see who changed what.
34. As an editor, I want a Change Request to disappear after review, so that the queue stays only pending work.
35. As a Contributor picker, I want to create a Visitor, so that external people can have a Profile.
36. As a visitor, I want old Sanity blog URLs to still resolve as Resources, so that links do not die.
37. As a deployer, I want public HTML to be static files, so that we stay on the Free plan.
38. As a deployer, I want a publish to rebuild the static site, so that visitors see new content without SSR.
39. As a deployer, I want no Cloudflare Images and no KV Sessions, so that we do not trip paid or write caps.
40. As a maintainer, I want `content/*.json` still importable, so that we can seed D1 without the old database.
41. As a maintainer, I want Next.js and Supabase gone after cutover, so that there is one stack.
42. As an agent, I want tests at named seams, so that refactors do not require rewriting tests.

## Implementation Decisions

- Host: Cloudflare Workers with the Astro Cloudflare adapter. Not Pages. Not OpenNext.
- Public routes prerender. Only the Gate, editor, and write endpoints run on the Worker.
- Records live in D1 with the same document-in-SQL shape we have now (slug + JSON), plus an Allowlist table.
- Media lives in R2. Chrome lives in the repo and is Sharp’d at build (`compile` image service, passthrough at runtime).
- Sessions are signed HttpOnly cookies. No KV. No Supabase Auth.
- Gate: DevClub OIDC → Kerberos → Allowlist. Else Admin password against a secret. No signup. Fail closed with no cookie.
- Level still comes from the Member row after the Gate.
- Keep Level and Listed rules. Drop the unused approvals RPC; one review path applies Change Requests in application code.
- Resize Media in the browser (about 400px and 1200px WebP) before upload. Worker only stores bytes.
- On successful direct publish or approved Change Request, trigger a static rebuild. Public pages must not SSR as a fallback on Free.
- Fold Sanity posts into Resources during migration; remove Studio.
- Port existing React explorers, cards, and editor as islands. Do not rewrite them in Astro templates.
- Tests run in Node against seams below. Fake D1/R2 in memory. Do not hit live Cloudflare in unit tests.

## Testing Decisions

A good test names a behaviour a person can observe and talks to a public function. It does not mock internal helpers, peek at tables, or recompute the expected value the same way the code does.

**Seams (only these):**

1. **Permissions** — given a Level and whether the person is Listed, can they publish, queue, approve, upload, or manage the Roster?
2. **Gate** — given Kerberos, Allowlist, and optional Admin credentials, do we mint a Session or refuse? Cookie round-trip included.
3. **Content store** — given seed records, can we read public documents, direct-publish, enqueue a Change Request, and apply an approval so a later read shows the new data?
4. **Upload policy** — given a file kind, size, and type, do we accept and what object keys/variants do we return? No real R2.

Do not add component snapshot tests for the ported React islands unless a ticket says so. Visual check is the Verify list.

Prior art: this repo has almost no tests today. New tests live next to the seam they cover.

TDD loop for tickets that name a seam: one failing test, then enough code to pass, then the next test. Prefactor and UI-port tickets may skip red-green if they only move files; they still run the existing permission tests if those files move.

## Out of Scope

- EmDash
- Cloudflare Images, KV, Durable Objects, Access, Stream, Email Sending
- Realtime collaboration or server-side drafts
- New password accounts, magic links, or self-signup
- Letting people off the Allowlist sign in to edit their Profile
- Changing the public visual design except where Astro islands require it
- Keeping Sanity or Supabase after cutover
- China Network, Argo, or other paid speed add-ons

## Further Notes

Work is one ticket at a time from `docs/migration/issues/`. Each ticket is a vertical slice with Verify steps and a Commit goal. Do not combine tickets in one commit.

ADR-0001 through ADR-0004 record the irreversible choices.
