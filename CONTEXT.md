# ARIES website

Public club site for ARIES at IIT Delhi, plus a gated editor for people who run the club.

## People

**Member**:
A person with a public profile on the site.
_Avoid_: user, account, student

**Kerberos**:
The IIT Delhi campus login id DevClub returns. It is how we recognise a Member at the gate.
_Avoid_: username, campus id, entry number (entry number is a different field)

**Level**:
The Member’s club tier. Values: oc, co_overall_coordinator, research_lead, coordinator, executive, member, blogger, alumni, visitor.
_Avoid_: role, permission, rank (those words are used loosely in the UI)

**Leadership**:
The Levels oc, co_overall_coordinator, and research_lead.
_Avoid_: admin (admin is the bootstrap password login, not a Level)

**Allowlist**:
The set of Kerberos ids that may receive a Session. Anyone else is refused at the Gate.
_Avoid_: ACL, whitelist, CMS users

**Visitor**:
A Level for people who are not ARIES Members but appear as contributors.

**Blogger**:
A Level that may publish Resources but not Projects or Events.

## Access

**Gate**:
The login check. DevClub Kerberos must be on the Allowlist, or the request must be the bootstrap admin password. There is no signup.
_Avoid_: auth middleware, OAuth (those are mechanisms)

**Session**:
Proof that the Gate passed. Club Level still comes from the Member row, never from the identity provider.
_Avoid_: JWT user, Supabase user

**Admin**:
The single password login for break-glass access. Not a Member Level. No other password logins exist.

## Content

**Roster**:
Leadership-edited identity for a Member: name, Level, Kerberos, email, avatar. Does not overwrite Profile Blocks.
_Avoid_: user table, people list

**Profile**:
The public page at a Member slug: tagline, socials, and Profile Blocks.

**Profile Block**:
One section on a Profile (tools, achievements, projects, coursework, hobbies, internships, research, text).

**Project**:
A club project page with contributors, media, and tags.

**Event**:
A club event page (talk, workshop, hackathon, or external).

**Resource**:
A blog, tutorial, course, or featured link. Includes posts that used to live in Sanity.

**Team Year**:
One year’s core team, coordinators, executive groups, and group photos.

**Alumnus**:
A past Member shown on the team page.

**Contributor**:
A person listed on a Project, Event, or Resource. May be a Member, Alumnus, Visitor, or external name.

**Listed**:
A Coordinator or Executive appears on that Project, Event, or Resource. Listing is what lets them edit it.

**Change Request**:
An unpublished edit or join request waiting for review. The only unpublished state. There are no drafts.

**Change Log**:
A record of a direct publish.

**Chrome**:
Brand and layout images that ship in the repo and are optimized at build.
_Avoid_: static assets (too generic)

**Media**:
Photos and clips uploaded through the editor. Stored as objects, not in git.
_Avoid_: images (ambiguous with Chrome)
