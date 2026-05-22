# Campaign Companion Acceptance

This checklist is the final acceptance note for the `sheet-0050` campaign companion epic after
`sheet-0051` through `sheet-0059` have landed. It records what is now covered by product docs,
automated checks, accessibility targets, and screenshots before the next roadmap slice begins.

## Delivered Scope

- Public SRD rules and browser-local play are available without sign-in.
- Public local characters and campaigns use browser storage with versioned export and import.
- The home page routes visitors to public rules, local play, sign-in, sheets, and campaigns.
- Admin invite and password-reset handoff now surfaces complete local links.
- Password setup and reset flows require confirmation and support password visibility controls.
- Admin capability can coexist with player or Game Master campaign membership.
- Campaign-scoped private rules sources remain hidden from public routes.
- Rules detail pages expose playable text, source context, mechanics, and stat-block paths where
  imported data provides them.
- Mira Voss has cleric-derived spells, actions, resources, equipment, and rule links.
- Admin, roster, campaign asset, sheet edit, and roll-popover surfaces have compact table-use
  layouts with light and dark screenshot evidence.
- Campaign images show seeded, uploaded, missing, protected, and fallback states explicitly.
- Campaign Ledger naming is reflected in package metadata, app chrome, docs, deployment copy, and
  compatibility environment variable guidance.

## Automated Acceptance

Run the full local gate:

```bash
bun run verify
```

That command covers:

| Check | Campaign companion evidence |
| --- | --- |
| Typecheck and tests | Public routes, local play document validation, rules imports, private source guards, combined admin membership, Mira seed data, HTMX fragments, compact components, and docs links. |
| Accessibility | Public home/login, local characters/campaigns, player roster, sheet, public rules list/detail, wiki, logout, Game Master campaign and roster, and admin pages. |
| MVP smoke | Seeded sign-in, public SRD rules, browser-local play import/export, player and Game Master character creation, sheet tabs, rule links, private campaign rules, Mira content, campaign sessions/wiki/assets, combined admin campaign access, admin handoff, and logout protection. |
| Screenshots | Public home, combined admin/player menu, local play, sheet light/dark states, core and skills edit states, roll results, Mira spellcasting, rosters, admin cards, campaign assets/rules sources, wiki images, rules list/detail, and edited sheet states. |

Routine `bun run verify` screenshots are written to a temporary directory to avoid changing the
tracked PR evidence images. Use `bun run screenshots:sheet` when a PR intentionally needs to refresh
`docs/pr-screenshots/`.

## Deferred Follow-Ups

- `sheet-0037` remains the named campaign-density follow-up for splitting sessions, wiki, images,
  faction management, and richer prep tools into focused Game Master subpages.
- `sheet-0040` is the next planned roadmap slice for Hyper-Dank package adoption before the next
  large Game Master prep/private NPC/Google Docs import epic.
- Character deletion, production email delivery, external identity, hosted backup automation,
  Postgres, and a guided character builder remain out of scope for this epic.
