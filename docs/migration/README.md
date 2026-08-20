# Rewrite (complete)

Spec: [spec.md](spec.md). Tickets: [issues/](issues/). Tickets **01–18 are `Status: done`**. This folder is the archive of the Next + Supabase + Sanity → Astro + D1 + R2 cutover. New work follows [AGENTS.md](../../AGENTS.md), not a new ticket in this series.

```mermaid
flowchart TD
  t01[01 permissions]
  t02[02 landing]
  t03[03 projects JSON]
  t04[04 events]
  t05[05 team]
  t06[06 resources]
  t07[07 profiles]
  t08[08 D1]
  t09[09 Gate]
  t10[10 publish Project]
  t11[11 Events and Resources]
  t12[12 Change Requests]
  t13[13 Roster Profile]
  t14[14 Media]
  t15[15 Allowlist UI]
  t16[16 fold Sanity]
  t17[17 rebuild]
  t18[18 cutover]
  t01 --> t10
  t02 --> t03
  t02 --> t09
  t02 --> t17
  t03 --> t04
  t03 --> t05
  t03 --> t06
  t03 --> t08
  t05 --> t07
  t03 --> t07
  t08 --> t09
  t08 --> t10
  t08 --> t13
  t09 --> t10
  t09 --> t13
  t09 --> t15
  t07 --> t13
  t10 --> t11
  t10 --> t12
  t10 --> t14
  t10 --> t17
  t11 --> t16
  t12 --> t18
  t13 --> t18
  t14 --> t18
  t15 --> t18
  t16 --> t18
  t17 --> t18
  t07 --> t18
```

## Phases (for humans)

1. **Foundation** — 01, 02
2. **Public static from JSON** — 03–07
3. **Store and Gate** — 08, 09
4. **Editor** — 10–15
5. **One CMS** — 16
6. **Free-tier production** — 17, 18
