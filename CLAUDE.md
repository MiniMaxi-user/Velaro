# Velaro — Project Guide voor Claude Code

> Dit bestand is leidend. Lees het bij elke sessie. Houd je aan de kaders hieronder
> en verzin geen eigen stack-, map- of stijlkeuzes. Wijk je af, meld het en vraag eerst.

## Wat we bouwen (MVP)

Velaro is een open platform voor de hippische sector. We beginnen **klein en gericht**:
een SaaS voor **pensionstallen** rond één centraal **paardenprofiel**.

Beachhead-doelgroep: **pensionstallen** (terugkerende omzet, veel paarden onder één dak).
Géén publieke API, géén AI-modules in de MVP. Die komen later.

> **Doorontwikkeling (vanaf juni 2026):** de MVP-kern staat. We zijn nu bewust
> begonnen aan de **paardenlease-module** (zie `velaro-leasemodule.md`) — een
> lease-marktplaats + contract + administratie rond het centrale paardprofiel.
> Dit is de eerste feature die buiten de oorspronkelijke MVP-scope valt; de keuze
> is gemaakt en vastgelegd. Marktplaats is daarmee niet langer "niet bouwen".

De drie soorten gebruikers in de MVP:
- **Staleigenaar** (`OWNER`) — beheert de stal en alle paarden erin.
- **Stalmedewerker** (`STAFF`) — werkt mee op de stal, beperktere rechten.
- **Paardeneigenaar** — ziet (alleen) het profiel van zijn/haar eigen paard(en).
- **Platform-admin** — beheert stallen en eigenaren op platform-niveau (apart admin-gedeelte).
- **Leaser** (doorontwikkeling, lease-module) — leaset een paard via een actieve
  `Lease`; krijgt beperkte leestoegang tot dat paardprofiel, vergelijkbaar met de
  paardeneigenaar-weergave. Geen stalbeheer-rechten.

## Tech-stack (vastgelegd — niet wijzigen zonder overleg)

- **Next.js** (App Router) + **TypeScript**
- **Supabase** — Auth én Postgres (één dienst); project `uzusejchqkqnivkmxbxe`, regio `eu-north-1`
- **Prisma 6** — ORM op de Postgres-database (géén Prisma 7 — dat vereist `prisma.config.ts`)
- **Tailwind CSS v4** — styling via `@theme` in CSS; **geen `tailwind.config.ts`**
- **Vercel** — hosting/deploy
- Package manager: **npm** (pnpm niet beschikbaar op deze machine)

### Tailwind v4 tokens
Tokens staan in `src/styles/globals.css` als `@theme { … }`. Utility-klassen zijn direct afgeleid:
`bg-background`, `bg-surface-1`, `bg-surface-2`, `text-navy`, `text-gold`, `border-border`, etc.
Nooit een `tailwind.config.ts` aanmaken — dat is Tailwind v3.

### Prisma
`prisma generate` en `prisma migrate` altijd via `npx prisma` in `C:\Claude\velaro`.
Prisma CLI leest `.env` (niet `.env.local`). Beide bestanden bestaan:
- `.env` — voor Prisma CLI
- `.env.local` — voor Next.js runtime

### Belangrijk onderscheid: authenticatie vs. autorisatie
- **Authenticatie** ("wie ben je") = Supabase Auth. Niet zelf bouwen.
- **Autorisatie** ("mag deze gebruiker dit paard zien/bewerken") = **wij**, in ons eigen
  datamodel en in de app-laag. Dit is kernlogica en wordt niet uitbesteed.
- Elke app-`User`-rij spiegelt een Supabase-auth-user: `User.id` == `auth.users.id` (uuid).

## Mapstructuur (feature-based, geen losse packages)

Eén Next.js-app. Modulair op **mapniveau**, niet op package-niveau. Geen monorepo.
Abstraheer pas als een patroon zich twee keer herhaalt — niet vooraf.

```
src/
  app/                          # routes (App Router)
    (auth)/                     # login, wachtwoord vergeten
    (app)/                      # ingelogde omgeving
      layout.tsx                # app-shell: Sidebar + Topbar
      stal/                     # actieve stal: dashboard, leden, taken
        leden/
        taken/
      paarden/                  # paardenprofiel (CRUD + gezondheid)
        [id]/
          vaccinaties/nieuw/
          ontworming/nieuw/
          dierenarts/nieuw/
          bewerken/
      stallen/                  # multi-stal beheer (OWNER: meerdere stallen)
        nieuw/
      admin/                    # platform-admin (eigenaren beheren)
        eigenaren/
          nieuw/
  features/                     # domeinlogica per feature
    auth/
    stal/
    paarden/
    gezondheid/
    taken/
    stallen/
    admin/
  components/                   # herbruikbare UI
    Sidebar.tsx                 # server component, sidebar nav
    SidebarClient.tsx           # client component, collapse-state
    Topbar.tsx                  # topbar met stal-context
    TopbarUserMenu.tsx          # user dropdown in topbar
    SignOutButton.tsx            # in sidebar-footer
    SubmitButton.tsx
  lib/
    supabase/                   # client.ts, server.ts, admin.ts
    auth/                       # autorisatie-helpers (rolcontrole)
    active-stable.ts            # actieve-stal-switcher helper
    prisma.ts
  styles/
    globals.css                 # design tokens (@theme) + component CSS
prisma/
  schema.prisma
```

## Naamgevingsconventies

- Componenten: `PascalCase` (bestand = componentnaam).
- Hooks/helpers/functies: `camelCase`.
- Database/Prisma-modellen: enkelvoud, `PascalCase` (`Horse`, `Stable`).
- Route-mappen: Nederlands, lowercase (`paarden`, `stal`) — UI is Nederlandstalig.
- UI-teksten: **Nederlands**.
- `StableRole` enum: `OWNER` (staleigenaar) | `STAFF` (stalmedewerker).

## Design system

De stijl is een **premium, licht thema met cream/navy en goud/amber accenten**,
kaart-gebaseerd, rustig en exclusief van uitstraling.

**Bron van waarheid voor tokens:** `src/styles/globals.css` (`@theme { … }`-blok).
Verzin geen nieuwe kleuren, fonts of spacing — neem over wat er staat.

Kernkleuren:
- Achtergrond:     `#F5F3EE` (`--velaro-color-bg`)
- Surface-1:       `#FFFFFF`
- Surface-2:       `#EEEAE2`
- Navy (tekst/UI): `#1A2B4A`
- Goud (accent):   `#D8BD71`
- Donker-goud:     `#BEA256`
- Amber:           `#F2AD75`
- Muted tekst:     `#6B7280`

Typografie: **Cormorant Garamond** (serif, koppen) + **Inter** (sans, body).
Google Fonts `@import` moet **vóór** `@import "tailwindcss"` staan (CSS spec-vereiste).

### Layout-patroon: sidebar
```
.app-shell          # flex-wrapper voor de hele app
  .sidebar          # navy links, vaste breedte, inklapbaar
  .app-main         # flex-column rechts
    Topbar          # bovenaan: stal-context + user-menu
    .content-area   # paginacontent
```

Bestaande class-conventies (auth-schermen):
`auth-layout`, `auth-card`, `auth-logo`, `auth-heading`, `auth-sub`,
`auth-divider`, `auth-footer`, `form-group`, `form-label`, `form-row`,
`form-link`, `btn-primary` (+ `btn-primary--full`), `btn-ghost`, `input`, `label`.

De `login.html` uit het design system is het referentiepunt voor de auth-schermen.
Logo: `velaro_logo.png` (staat in `public/`).

## Bouwvolgorde (van fundament naar feature)

1. ✅ **Datamodel + auth** — Prisma-schema, Supabase Auth, rollen/autorisatie-helpers,
   login- en wachtwoord-vergeten-scherm.
2. ✅ **Centraal paardenprofiel (CRUD)** — paard aanmaken, bekijken, bewerken.
3. ✅ **Gezondheidsregistratie** — vaccinaties, ontworming, dierenartsbezoekenop het profiel.
4. ✅ **Stalbewoners-overzicht + taken** — ledenlijst, taken/planning.
   Ook gebouwd: **multi-stal beheer** (OWNER beheert meerdere stallen, actieve-stal-switcher)
   en **platform-admin** (eigenaren + quota beheren).
5. ⬜ **Eigenaarscommunicatie + gedeeld profiel** — eigenaar ziet zijn paard.
6. ⬜ **Facturatie** — maandelijkse stalling + extra's. Bewust als laatste.
7. ⬜ **Paardenlease-module** (doorontwikkeling) — lease-marktplaats, contracten,
   kostenverdeling, verzekering/aansprakelijkheid, kalender, notificaties.
   Opgesplitst in 10 genummerde stories `[Lease 01]`…`[Lease 10]` onder epic #59
   op het bord; fundament-eerst (datamodel + autorisatie vóór features).
   Bron/visie: `velaro-leasemodule.md`.

> Buiten scope, niet bouwen tot afgesproken: open API, AI-modules,
> integraties (KNHS/FEI), wearables.

## Werkwijze met Claude Code

- **Plan eerst, code daarna.** Bij elke nieuwe stap of feature: lever eerst een kort
  plan (welke bestanden, welk datamodel-effect, welke routes). Wacht op akkoord.
- **Werk per stap uit de bouwvolgorde.** Niet vooruitlopen op latere stappen.
- **Fundament-stappen streng**: geen schema-wijzigingen zonder overleg.
- Geen `localStorage`-afhankelijke kernlogica; staat hoort in DB of server.
- Bij twijfel over scope of stijl: vraag, niet aannemen.
