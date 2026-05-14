# Vaste Grond — Prep Tool

Productie-app voor het voorbereiden van pop-up diners ("Vaste Grond" bij Vogelfrei). Vervangt het prototype `vaste_grond_prep_2.jsx` in de bovenliggende map.

## Tech stack

- Vite + React 18 + TypeScript (strict)
- React Router v6
- Tailwind CSS + CSS variables voor design tokens (iOS-inspired)
- shadcn/ui waar het past, anders eigen componenten
- lucide-react icons
- Supabase (Postgres + Auth met magic link)
- TanStack Query voor server state
- React Hook Form + Zod
- sonner voor toasts
- date-fns met Nederlandse locale
- Cloudflare Pages voor hosting (SPA mode)

## Conventies

- Code in het Engels, UI-strings in het Nederlands
- snake_case kolommen in Supabase, camelCase in TS
- Bedragen: `formatEuro` (`€1.234,56`)
- Datums: `formatDateLong` ("30 juli 2026")
- Immutable updates, geen `any` tenzij onvermijdelijk (met comment)

## Folder layout

```
src/
  lib/            supabase client, queryClient, format, cn
  hooks/          custom hooks (useEvent, useDishes, ...)
  components/    herbruikbare UI primitives
  routes/         AppShell + route components (1 per tab)
  features/       domein-modules (event, menu, dishes, ...)
  types/          gedeelde TS types & DB-schema typing
supabase/
  migrations/     SQL migraties
  config.toml     lokale stack-config
```

## Routes (8 tabs)

`/overview`, `/menu`, `/dishes`, `/ingredients`, `/shopping`, `/guests`, `/finance`, `/settings`. `/login` apart buiten de shell.

## Datamodel (samenvatting)

Zie ook het prototype voor logica. Tabellen:

- `events` — pop-up-avond (datum, gasten, ticket_price, locatie_kosten, etc.). We hebben er 3: 30/31 juli + 1 aug 2026.
- `courses` — gangen van het gedeelde menu (volgorde, naam). **Eén menu voor alle 3 avonden** — popup-context, identieke kaart, alleen gasten en allergenen verschillen.
- `dishes` — gerecht (per gang, portions, notes)
- `ingredients` — ingredient-bibliotheek (naam, eenheid, prijs_per_eenheid, leverancier)
- `dish_ingredients` — koppeltabel (gerecht ↔ ingredient + hoeveelheid)
- `guests` — gast-RSVP (naam, status, aantal_personen, dieet, notes)
- `team_members` — teamleden (alle toegang gelijk)
- `expenses` — overige uitgaven (categorie, omschrijving, bedrag)

Kritische berekeningen die in code-comments uitgelegd moeten staan:
1. **Foodcost per gerecht** = som(`hoeveelheid * prijs_per_eenheid`) van alle ingredienten, gedeeld door portions.
2. **Boodschappen-aggregatie** = sommeer per ingredient over alle gerechten × gasten, afgerond naar inkoop-eenheid.
3. **Vogelfrei-afrekening** = (gasten × ticket) − foodcost-totaal − locatie_kosten − overige_kosten.

## Status

- [x] Fase 0: Vite + TS scaffolding, Tailwind, project structuur, env, supabase init, git init
- [x] Fase 1: Auth (magic link) + AuthGuard + lege AppShell live
- [x] Fase 2: Eerste migratie, types, read-only data layer
- [x] Fase 3: Event-overzicht (lezen + bewerken)
- [x] Fase 4: Menu/gangen (gedeeld over alle avonden, zie migratie 0005)
- [x] Fase 5: Gerechten + ingredienten + foodcost
- [x] Fase 6: Boodschappenlijst
- [x] Fase 7: Gasten + financieel (Vogelfrei-afrekening)
- [x] Fase 8: Settings + team
- [x] Fase 9: iOS-polish (skeleton, empty-state, tap-feedback, animate-rise)
- [x] Fase 10: Cloudflare Workers deploy (Workers + static assets, niet klassieke Pages) — live op vastegrond.stefvandijk10.workers.dev

## Deploy (Cloudflare Pages)

- Hosting: Cloudflare Pages, SPA-mode via `public/_redirects` (`/* → /index.html 200`).
- Node-versie: `.nvmrc` = 22.
- Build command: `npm run build`, output: `dist/`.
- Required env vars in Cloudflare project (Production + Preview):
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- Na eerste deploy: voeg de pages.dev-URL toe aan Supabase → Authentication → URL Configuration → Site URL + Additional redirect URLs (`https://<project>.pages.dev/**`).

## Niet bouwen

Avond-zelf draaiboek, POS, voorraad, AI-chat, notificaties, activity feed, foto-upload, marketing tools, aparte permissies. Bij twijfel: vragen.

## Werkwijze per fase

Na elke fase: stoppen, testen, feedback. Kleine commits per logische unit. Geen `console.log` in commits. Geen TODO zonder uitleg.
