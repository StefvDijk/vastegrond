# Vaste Grond — Prep Tool

Productie-app voor het voorbereiden van pop-up diners ("Vaste Grond" bij Vogelfrei). Vervangt het prototype `vaste_grond_prep_2.jsx` in de bovenliggende map.

## Tech stack

- Vite + React 18 + TypeScript (strict)
- React Router v6
- Tailwind CSS + CSS variables voor design tokens (iOS-inspired)
- shadcn/ui waar het past, anders eigen componenten
- lucide-react icons
- Supabase (Postgres + Auth met email + 4-cijferige code, team-allowlist via RLS)
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

## Routes (10 tabs)

`/overview`, `/menu`, `/dishes`, `/ingredients`, `/shopping`, `/guests`, `/finance`, `/notes`, `/inspiration`, `/settings`. `/login` apart buiten de shell.

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
- `notes` — vrije notities (titel, body, tags[], optionele koppeling aan dish/course, author)
- `inspirations` — links/recepten/foto's (title, note, url?, image_path?, tags[], dish/course koppeling, author). `image_path` verwijst naar een object in de private Supabase Storage bucket `inspirations`. Frontend gebruikt signed URLs (1u) via `features/inspirations/storage.ts`.

Kritische berekeningen die in code-comments uitgelegd moeten staan:
1. **Foodcost per gerecht** = som(`hoeveelheid * prijs_per_eenheid`) van alle ingredienten, gedeeld door portions.
2. **Boodschappen-aggregatie** = sommeer per ingredient over alle gerechten × gasten, afgerond naar inkoop-eenheid.
3. **Vogelfrei-afrekening** = (gasten × ticket) − 40% afdracht aan Vogelfrei − foodcost-totaal − locatie_kosten − overige_kosten. De 40%-share zit als constante `VOGELFREI_SHARE` in `src/lib/finance.ts`.

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
- [x] Fase 11: Notities + Inspiratie tabbladen (vrije notities, links/foto's met Supabase Storage)
- [x] Fase 12: Design system v2026.1 (SF Pro stack, vg-* components, alle 10 routes herbouwd)
- [x] Fase 13: Productie-hardening — team-allowlist RLS (migr. 0008/0009), PIN-auth (email + 4 cijfers via signInWithPassword), prod-domain odeaanoma.nl

## Deploy (Cloudflare Workers + custom domain)

- Hosting: Cloudflare Workers met static assets. SPA-fallback via `not_found_handling: "single-page-application"` (in CF dashboard).
- Productie-URL: `https://odeaanoma.nl`. Fallback: `vastegrond.stefvandijk10.workers.dev`.
- Node-versie: `.nvmrc` = 22.
- Build command: `npm run build`, output: `dist/`.
- Required env vars in Cloudflare project (Production + Preview):
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- Supabase → Authentication → URL Configuration: Site URL = `https://odeaanoma.nl`, Additional redirect URLs incl. `http://localhost:5173/**`.

## Auth (PIN-code, geen magic link)

- 2 vaste accounts in `auth.users`: `stefvandijk10@gmail.com`, `morrison_mensink@hotmail.com`. Wachtwoord = 4-cijferige PIN.
- Login = `signInWithPassword`. Session persistent ~30 dagen (Supabase default refresh-token).
- RLS-allowlist: alleen wie in `public.team_members` (op email) staat mag iets lezen/schrijven (migratie 0009).
- Nieuwe gebruiker toevoegen: (1) via Supabase Dashboard auth.users aanmaken met password, (2) hetzelfde email in `team_members` invoeren.

## Niet bouwen

Avond-zelf draaiboek, POS, voorraad, AI-chat, notificaties, activity feed, marketing tools, aparte permissies. Bij twijfel: vragen.

Foto-upload bestaat alleen op `/inspiration` (private bucket `inspirations`); niet uitbreiden naar andere modules zonder overleg.

## Werkwijze per fase

Na elke fase: stoppen, testen, feedback. Kleine commits per logische unit. Geen `console.log` in commits. Geen TODO zonder uitleg.
