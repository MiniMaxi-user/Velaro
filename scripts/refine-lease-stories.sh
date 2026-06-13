#!/usr/bin/env bash
set -euo pipefail
REPO="MiniMaxi-user/velaro"
ref="Onderdeel van epic #59. Gereviewd met de huidige app-context en de visie uit \`velaro-leasemodule.md\`."

edit () { gh issue edit "$1" --repo "$REPO" --body "$2" >/dev/null && echo "Updated #$1"; }

# ── EPIC #59 ──────────────────────────────────────────────────────────────────
edit 59 "$(cat <<'EOF'
Overkoepelende feature voor de **paardenlease-module** (zie `velaro-leasemodule.md`).

Velaro's onderscheidend vermogen: integratie van **matching → contract → administratie → paardprofiel** rond het centrale paardprofiel — dat bestaat bij geen enkele speler (Horsify, HorseDeal, DigiPaard dekken slechts delen). We zitten nu in de **doorontwikkeling** (vastgelegd in CLAUDE.md); fundament-eerst opgebouwd.

## Vaste plekken in de UI (consistent met bestaande patronen)
Om de module te laten "passen" in de huidige app gebruiken we deze ankerpunten — overal hergebruik van bestaande klassen (`panel`, `page-header`, `breadcrumb`, `btn-primary/secondary`, `badge`, `kpi-row`, `filter-bar`, `empty-state`, `detail-tabs-layout`):

- **Sidebar** (`src/components/NavLinks.tsx`): nieuw item **"Lease"** in `STAL_LINKS`, tussen *Paarden* en *Taken* → `/lease`. Voor de leaser-rol een item **"Marktplaats"** in `EIGENAAR_LINKS`.
- **Paard-detailpagina** (`PaardDetailTabs`): extra tab **"Lease"** (na *Eigenaren*); de 70/30-layout blijft intact.
- **Topbar `NotificationBell`**: lease-mijlpalen verschijnen naast berichten.
- **`/berichten`**: tweepane gesprekkenoverzicht (lijst links, thread rechts) voor lease-contact.
- **Leaser-dashboard**: hergebruik van de bestaande eigenaar-weergave (`/eigenaar`), geleasede paarden met een onderscheidende **Lease-badge**.

## Bouwvolgorde (sub-issues, in deze volgorde verwerken)
1. `[Lease 01]` #60 — Datamodel & migratie — lease-kern *(geen UI)*
2. `[Lease 02]` #61 — Autorisatie: leaser-rol & toegang eigen geleased paard
3. `[Lease 03]` #62 — Marktplaats: lease-aanbod beheren (CRUD listing)
4. `[Lease 04]` #63 — Marktplaats: overzicht, filters & matching-score
5. `[Lease 05]` #64 — Communicatie: interesse tonen & in-app contact
6. `[Lease 06]` #65 — Contracttemplates per variant + digitale ondertekening
7. `[Lease 07]` #66 — Kostenverdeling & betaaladministratie
8. `[Lease 08]` #67 — Verzekering- & aansprakelijkheidsregistratie (6:179 BW)
9. `[Lease 09]` #68 — Gedeelde beschikbaarheidskalender (deellease)
10. `[Lease 10]` #69 — Mijlpaal-/notificatiemotor

## Fasering
- **Fase 1 (marktplaats → contract):** 01–06.
- **Fase 2 (transactie & beheer):** 07–09.
- **Fase 3 (retentie):** 10.
EOF
)"

# ── #60 — Lease 01 ────────────────────────────────────────────────────────────
edit 60 "$(cat <<EOF
$ref

**Doel:** fundament leggen voor de leasemodule in het Prisma-datamodel. **Geen UI in deze story** — die volgt vanaf Lease 02.

## Datamodel-effect (Prisma)
Nieuwe modellen, hakend aan \`Horse\` (centraal profiel):
- \`LeaseListing\` — lease-**aanbod** bij een \`Horse\`: \`leaseType\`, \`daysPerWeek\`, \`pricePerMonth\`, \`region\`, \`discipline\`, \`movable\`, \`exclusive\`, \`description\`, \`isActive\`.
- \`Lease\` — actieve **overeenkomst** die een leaser (\`User\`) aan een \`Horse\` koppelt: \`leaseType\`, \`startDate\`, \`endDate\`, \`minimumTermMonths\`, \`noticePeriodDays\`, \`trialEndsAt\`, \`status\`.
- Enum \`LeaseType\`: \`FULL\`, \`DEEL\`, \`BIJRIJDEN\`, \`WEDSTRIJD\`, \`KOOPOPTIE\`, \`FOK\`.
- Enum \`LeaseStatus\`: \`CONCEPT\`, \`ACTIEF\`, \`OPGEZEGD\`, \`BEEINDIGD\`.
- Terugrelaties op \`Horse\` (\`leaseListings\`, \`leases\`) en \`User\` (\`leases\`).

## UI & plaatsing
N.v.t. — alleen schema + migratie. Wel: zet de Nederlandse labels voor \`LeaseType\` alvast in een helper (\`src/features/lease/leaseHelpers.ts\`, net als \`paardHelpers.ts\` met \`GESLACHT_LABELS\`) zodat alle volgende UI-stories dezelfde teksten gebruiken (Full lease, Deellease, Bijrijden, Wedstrijdlease, Lease met koopoptie, Foklease).

## Acceptatie
- Schema uitgebreid, \`npx prisma migrate\` draait schoon (Prisma 6, geen prisma.config.ts).
- \`npx prisma generate\` werkt; bestaande build blijft groen.
- \`leaseHelpers.ts\` met label-maps aanwezig.

**Afhankelijkheden:** geen — dit is het fundament. **Size:** M
EOF
)"

# ── #61 — Lease 02 ────────────────────────────────────────────────────────────
edit 61 "$(cat <<EOF
$ref

**Doel:** een leaser (gekoppeld via een actieve \`Lease\`) krijgt — net als een paardeneigenaar — **lees**toegang tot het profiel van zijn/haar geleasede paard.

## Scope (autorisatie)
- \`canViewHorse(userId, horseId)\` in \`src/lib/auth/authorization.ts\` wordt ook \`true\` bij een **actieve** \`Lease\` (status \`ACTIEF\`).
- Nieuwe helper \`getLeaseForHorse(userId, horseId)\` zodat de UI weet of iemand leaser is.
- Leaser krijgt **geen** \`canEdit\` (geen stalbeheer); valt in de bestaande \`canEdit === false\`-tak van de paard-detailpagina.

## UI & plaatsing
- **Leaser-dashboard:** leaser zonder stallidmaatschap volgt \`EIGENAAR_LINKS\` (\`NavLinks.tsx\`) en landt op \`/eigenaar\`. Onder *"Mijn paarden"* verschijnen óók geleasede paarden, met een goud **\`badge badge-gold\` "Lease"** naast de reeds bestaande kaarten, zodat onderscheid eigen vs. geleased meteen zichtbaar is. Bovenaan de sectie een subkop "In lease" als de gebruiker zowel eigen als geleasede paarden heeft.
- **Paard-detailpagina** (\`paarden/[id]/page.tsx\`): leaser krijgt de bestaande read-only weergave (\`detail-layout\`, geen tabstrip). In de \`detail-header\` \`detail-meta\` komt een extra \`badge badge-gold\` **"In lease — {leaseType-label}"**. Zichtbaar voor de leaser: Algemeen, Gezondheid, Voederschema, Berichten. **Niet** zichtbaar: Eigenaren-paneel, verwijder/bewerk-acties.
- Geen toegang tot \`/stal\`, \`/paarden\` (lijst van de hele stal) of andere paarden — alleen het eigen geleasede paard via directe link/dashboard.

## UX-richtlijnen
- Eén heldere visuele code: goud = lease. Consistent op kaart én detail.
- Leaser mag nooit "lege" beheerknoppen zien die toch niets doen — server-side afschermen, niet alleen verbergen.

## Acceptatie
- Ingelogde leaser ziet uitsluitend het/de geleasede paard(en); geen stalbeheer.
- Lease-badge zichtbaar op dashboard-kaart én detail-header.
- Niet-leasers zien niets extra's; autorisatie afgedwongen op de server.

**Afhankelijkheden:** Lease 01. **Size:** M
EOF
)"

# ── #62 — Lease 03 ────────────────────────────────────────────────────────────
edit 62 "$(cat <<EOF
$ref

**Doel:** eigenaar/stal kan een lease-**aanbod** (\`LeaseListing\`) aanmaken, bewerken, (de)activeren en verwijderen, vanaf het paardprofiel.

## UI & plaatsing
- **Nieuwe tab "Lease"** in \`PaardDetailTabs\` (na *Eigenaren*), alleen voor stalleden (\`canEdit\`). De 70/30-layout blijft; de tab vult de linker 70%-kolom.
- **Leeg (geen listing):** \`empty-state\` met titel "Nog geen lease-aanbod" + korte uitleg + knop \`btn-primary\` **"+ Plaats lease-aanbod"**.
- **Met listing:** een \`panel\` "Lease-aanbod" met \`panel-header\` (titel + \`badge\` status: groen \`badge-success\` "Actief" / grijs \`badge-neutral\` "Inactief"). In \`panel-body\` een \`detail-fields\`-grid: Leasetype (badge), Prijs p/m, Dagen/week, Regio, Discipline, "Mag verplaatst worden" (ja/nee), Exclusief/gedeeld. Onderaan acties: \`btn-secondary\` **"Bewerken"** + een toggle **"Actief/Inactief"** + \`btn-ghost\` "Verwijderen".
- **Formulier-subroutes**, exact volgens het bestaande nieuw/bewerken-patroon van gezondheid (\`paarden/[id]/vaccinaties/nieuw\`): \`paarden/[id]/lease/nieuw\` en \`paarden/[id]/lease/bewerken\`. Gebruik \`form-group\`, \`form-row\`, \`label\`, \`input\`, \`SubmitButton\`. Leasetype als select met de labels uit \`leaseHelpers.ts\`; prijs als number; "movable"/"exclusive" als checkbox.

## UX-richtlijnen
- Aanbod beheer je altíjd vanaf het paard zelf — consistent met hoe gezondheid/voederschema werken; geen apart los beheerscherm.
- Eén paard = max. één actief aanbod tegelijk (toon waarschuwing bij tweede). Inactief zetten i.p.v. verwijderen aanmoedigen (behoud historie).

## Acceptatie
- CRUD via server actions, validatie op verplichte velden (leasetype, prijs).
- Listing zichtbaar in de Lease-tab; (de)activeren werkt; \`isActive\` bepaalt publieke zichtbaarheid (Lease 04).

**Afhankelijkheden:** Lease 01. **Size:** M
EOF
)"

# ── #63 — Lease 04 ────────────────────────────────────────────────────────────
edit 63 "$(cat <<EOF
$ref

**Doel:** een **marktplaats** met alle actieve lease-listings — over stallen heen (open-platform-visie) — met filters en een eenvoudige matching-score (zoals HorseDeal).

## UI & plaatsing
- **Nieuwe top-level route \`/lease\`**, bereikbaar via het nieuwe sidebar-item **"Lease"** (stalleden) / **"Marktplaats"** (leasers). \`page-header\` met \`breadcrumb\` (Dashboard › Lease-marktplaats) en \`page-title\` "Lease-marktplaats".
- **Filterbalk** bovenaan met de bestaande \`filter-bar\`-klasse: selects/chips voor Leasetype, Discipline, Niveau, Dagen/week, Regio, Prijsrange (min–max) en een toggle "Mag verplaatst worden". Filters server-side via querystring (zoals taken-datumnavigatie).
- **Resultaten als kaart-grid** (responsive, hergebruik kaartstijl van paarden/kpi): per listing een kaart met paardfoto (of placeholder), paardnaam, \`badge\` leasetype, **prijs/maand** prominent, regio, en rechtsboven een goud \`badge-gold\` **match-score** ("92% match") wanneer de gebruiker filtervoorkeuren heeft ingevuld. Klik → listingdetail.
- **\`empty-state\`** als geen enkele listing matcht ("Geen aanbod gevonden — pas je filters aan").
- Optioneel een \`kpi-row\` bovenaan: aantal actieve listings, gemiddelde prijs.
- **Listingdetail \`/lease/[listingId]\`:** hero met grote foto + \`detail-header\` (paardnaam, leasetype-badge, prijs), \`detail-fields\` met alle kenmerken, een (beperkt) blok "Over dit paard" (ras/leeftijd/discipline uit het profiel, géén privégegevens), en een prominente \`btn-primary\` **"Interesse tonen"** (→ Lease 05).

## Matching-score
- Geen ML: gewogen criteria-match (discipline, dagen/week, regio, prijs binnen budget, leasetype) → percentage. Sorteer aflopend op score wanneer voorkeuren bekend zijn, anders op recentheid.

## UX-richtlijnen
- Kaarten moeten ademen: max. ~6 datapunten per kaart, prijs en leasetype direct leesbaar.
- Filters mogen het overzicht niet wegdrukken — horizontale \`filter-bar\`, inklapbaar op smal scherm.
- Score is een hint, geen harde sortering die relevant aanbod verbergt.

## Acceptatie
- Alleen \`isActive\` listings zichtbaar; filters werken server-side.
- Score-sortering aantoonbaar; lege staat afgehandeld; detailpagina toont "Interesse tonen".

**Afhankelijkheden:** Lease 03. **Size:** L
EOF
)"

# ── #64 — Lease 05 ────────────────────────────────────────────────────────────
edit 64 "$(cat <<EOF
$ref

**Doel:** een geïnteresseerde leaser komt laagdrempelig in contact met de aanbieder — dé pijn die Marktplaats/Facebook niet oplossen.

## UI & plaatsing
- **Start:** \`btn-primary\` **"Interesse tonen"** op de listingdetail (\`/lease/[listingId]\`) opent een compacte composer (paneel/modal in \`panel\`-stijl) met een korte begeleidende boodschap. Verzenden maakt een 1-op-1 gespreksthread tussen geïnteresseerde en aanbieder, met de listing als context-kop.
- **Tweepane gesprekkenoverzicht \`/berichten\`:** links een gesprekkenlijst (avatar/initialen, naam, laatste bericht, ongelezen-stip), rechts de actieve thread met een context-header ("Over: {paardnaam} — {leasetype}") en een berichtenstroom + invoerveld onderaan. Hergebruik de visuele taal van \`BerichtenPanel\`/\`BerichtItem\`.
- **Topbar:** ongelezen lease-gesprekken tellen mee in de bestaande **\`NotificationBell\`**; klik leidt naar \`/berichten\`. Voeg "Berichten" toe aan het topbar/user-menu of als bel-dropdown-item.
- Datamodel: óf voortbouwen op \`Message\`/\`MessageRead\` (1-op-1 i.p.v. stal/paard-broadcast) óf een lichte \`LeaseInquiry\`-thread — kies en motiveer in de PR; sluit aan op het bestaande gelezen/ongelezen-patroon.

## UX-richtlijnen
- Eerste contact moet in ≤2 kliks kunnen (knop → typen → versturen).
- Thread toont altijd wáár het over gaat (listing-context), zodat een aanbieder met meerdere paarden niet de draad kwijtraakt.
- Duidelijke ongelezen-indicatie op bel én in de lijst.

## Acceptatie
- Aanbieder ontvangt interesse en kan reageren; beide partijen zien dezelfde thread.
- Ongelezen-teller werkt in de topbar; toegang strikt tot de twee partijen.

**Afhankelijkheden:** Lease 04 + bestaande berichten-infra. **Size:** L
EOF
)"

# ── #65 — Lease 06 ────────────────────────────────────────────────────────────
edit 65 "$(cat <<EOF
$ref

**Doel:** kant-en-klare, aankruisbare contracttemplates per leasevariant met digitale ondertekening. Start met **deellease + full lease** (grootste volume).

## UI & plaatsing
- **Start:** vanuit de **Lease-tab** op de paard-detailpagina (of vanuit een geaccepteerde interesse) een \`btn-primary\` **"Contract opstellen"** → route \`/lease/[leaseId]/contract\`.
- **Tweekoloms editor** (zelfde geest als de 70/30-detaillayout): **links** een gesectioneerd formulier/wizard volgens de FNRS-artikelstructuur (zie marktonderzoek §4) — partijen, paard, duur/proeftijd, gebruiksrecht (dagen/week), disciplines, kostenverdeling, leasevergoeding, aansprakelijkheid, verzekering, opzegging, eerste recht van koop, minderjarigheid; **rechts** een **live documentpreview** die meegroeit terwijl je invult. Aankruisbare opties als checkboxes/selects.
- Bovenaan een opvallende **disclaimer-banner** (\`badge-warning\`-stijl): "Geen juridisch advies — laat contracten juridisch toetsen vóór gebruik."
- **Ondertekenen:** onderaan handtekeningblokken per partij + \`btn-primary\` **"Onderteken"**; na ondertekening wordt het document read-only met een \`badge\` status (grijs "Concept" → groen \`badge-success\` "Ondertekend") en vastgelegd op de \`Lease\` (datum + ondertekenaars). Voor minderjarige leaser: extra medeondertekenblok ouder/voogd.
- Het ondertekende contract blijft inzichtelijk als read-only documentweergave vanuit de Lease-tab.

## UX-richtlijnen
- Wizard met voortgangsindicatie; gebruiker ziet door de live preview direct wat het contract wordt.
- Defaults invullen vanuit de \`Lease\`/listing (paard, leasetype, prijs, dagen) zodat invullen minimaal is.
- Onomkeerbaarheid van ondertekenen duidelijk bevestigen.

## Acceptatie
- Een lease kan met ingevuld template worden vastgelegd en digitaal ondertekend; status zichtbaar.
- Minimaal deellease + full lease templates beschikbaar; disclaimer prominent.

**Afhankelijkheden:** Lease 01 (Lease), Lease 02. **Size:** XL
EOF
)"

# ── #66 — Lease 07 ────────────────────────────────────────────────────────────
edit 66 "$(cat <<EOF
$ref

**Doel:** maandelijkse leasevergoeding + splitsing van kostenposten administreren, met btw-afhandeling.

## UI & plaatsing
- **Paneel "Kosten & betaling"** binnen de **Lease-tab** (of op een lease-detailpagina \`/lease/[leaseId]\`), in \`panel\`-stijl.
- **Kostenverdeel-tabel:** rijen per post (Hoefsmid, Dierenarts, Voer, Stalling, Tuig, Overig) met kolommen *Post | Wie betaalt (eigenaar/leaser) | Bedrag*. Inline bewerkbaar; "wie betaalt" als select.
- **Leasevergoeding:** apart veld (maandbedrag) met **btw-toggle 21%**; toon onder de tabel een \`detail-fields\`-blok met *Subtotaal / Btw 21% / Totaal p/m* zodat het btw-effect transparant is. Korte hint dat lease 21% is (sport/sportaccommodatie 9% geldt hier niet).
- **Maandoverzicht:** een compacte samenvattingskaart per partij ("Leaser betaalt €… p/m", "Eigenaar draagt …"). Grote/onvoorziene dierenartskosten markeerbaar met een \`badge-warning\` "Onvoorzien".
- Echte incasso/PSP-koppeling is **buiten scope** van deze story (alleen administratie/overzicht) — noteer als follow-up richting de latere facturatie-stap (bouwvolgorde 6).

## UX-richtlijnen
- Btw nooit verstoppen: subtotaal/btw/totaal altijd zichtbaar.
- Wie-betaalt-wat in één oogopslag leesbaar; default-verdeling voorinvullen (leaser: vergoeding; eigenaar: zorgkosten).

## Acceptatie
- Per lease zijn vergoeding + kostenverdeling + btw correct zichtbaar; maandoverzicht per partij.

**Afhankelijkheden:** Lease 06. Sluit aan op facturatie-stap. **Size:** L
EOF
)"

# ── #67 — Lease 08 ────────────────────────────────────────────────────────────
edit 67 "$(cat <<EOF
$ref

**Doel:** onderscheidend vertrouwens-/veiligheidskenmerk — aansprakelijkheid (art. 6:179 BW) en verzekering expliciet vastleggen per lease.

## UI & plaatsing
- **Paneel "Verzekering & aansprakelijkheid"** in de **Lease-tab** / lease-detailpagina.
- **Kernvraag prominent:** een verplichte ja/nee-keuze **"Is de leaser meeverzekerd op de WA/AVP-polis van de eigenaar?"** als opvallende keuzeknoppen bovenaan het paneel.
- **6:179 BW-checklist:** een korte lijst met afvinkbare punten (risico-acceptatie, meeverzekering, dekking ongevallen ruiter) — kort en begrijpelijk, met een infotekst die naar het marktonderzoek verwijst (LG München I).
- **Polis-uploads:** rijen om polissen toe te voegen (WA/AVP, ongevallen ruiter, ziektekosten-/cascoverzekering paard) — bestandsnaam + type + uploaddatum.
- **Waarschuwing:** als "meeverzekerd" = nee of leeg, toon een rode \`badge-warning\`-banner; de \`Lease\` kan dan **niet** op status \`ACTIEF\` worden gezet zonder expliciete risicobevestiging (checkbox "Ik begrijp het risico").

## UX-richtlijnen
- Dit is een trust-feature: rustig maar duidelijk, niet bangmakerig. De waarschuwing is een gate, geen blokkade-zonder-uitweg.
- Polissen zichtbaar voor beide betrokken partijen, niet voor derden.

## Acceptatie
- Lease kan niet "actief" worden zonder beantwoorde meeverzekerd-vraag (of expliciete risicobevestiging).
- Checklist + polis-uploads aanwezig; waarschuwing verschijnt correct.

**Afhankelijkheden:** Lease 06. **Size:** M
EOF
)"

# ── #68 — Lease 09 ────────────────────────────────────────────────────────────
edit 68 "$(cat <<EOF
$ref

**Doel:** bij deellease/gedeeld gebruik voorkomen dat partijen tegelijk willen rijden — wie rijdt welke dag.

## UI & plaatsing
- **Paneel "Beschikbaarheid"** in de **Lease-tab** (zichtbaar voor eigenaar én leaser van het paard).
- **Weekrooster:** een grid van **dagen (ma–zo) × dagdelen (ochtend/middag/avond)**; cellen tonen geclaimde blokken, gekleurd **per persoon** met een legenda eronder. Standaard weergave = huidige week, met week-vooruit/terug-navigatie (zelfde patroon als de taken-datumnavigatie).
- **Claimen:** klik op een vrije cel → bevestigen → de cel kleurt met de naam. Afgeleid van het weekschema uit het contract (dagen/week, exclusief vs. gedeeld) zodat een leaser niet méér dagdelen kan claimen dan afgesproken.
- **Conflictpreventie:** een al-geclaimde cel is niet opnieuw claimbaar; poging toont een korte melding ("Dit dagdeel is al bezet").
- Eigenaar ziet alle claims van het paard in één overzicht.

## UX-richtlijnen
- Kleurcodering + legenda maken in één blik duidelijk wie wanneer rijdt.
- Conflict wordt vóóraf voorkomen, niet achteraf gemeld.
- Mobiel: rooster horizontaal scrollbaar, niet ingedikt tot onleesbaar.

## Acceptatie
- Leaser ziet en claimt beschikbare dagdelen binnen de contractlimiet; dubbele claims worden voorkomen.
- Eigenaar houdt overzicht over alle claims.

**Afhankelijkheden:** Lease 02, Lease 06. **Size:** L
EOF
)"

# ── #69 — Lease 10 ────────────────────────────────────────────────────────────
edit 69 "$(cat <<EOF
$ref

**Doel:** automatische alerts rond de lease-levenscyclus — voor retentie en om deadlines niet te missen.

## UI & plaatsing
- **Topbar \`NotificationBell\`:** lease-mijlpalen verschijnen in de bestaande bel-dropdown, naast berichten — elk item met een type-icoon en korte tekst: *einde proefperiode*, *einddatum/minimumduur nadert*, *opzegtermijn-deadline*, *stilzwijgende verlenging*, en paardgebonden herinneringen (vaccinatie/hoefsmit) voor de leaser. Klik → relevante pagina (lease/paard).
- **Dashboard-paneel "Aandachtspunten":** op het leaser- én eigenaar-dashboard een paneel in de geest van het bestaande \`AankomendZorgPanel\` met de eerstvolgende lease-mijlpalen (datum + actie), gesorteerd op urgentie. Verstreken/urgente items in \`badge-warning\`.
- **Gelezen-status:** items markeerbaar als gelezen volgens het bestaande \`MessageRead\`-patroon; de bel-teller daalt mee.
- Mijlpalen worden afgeleid uit \`Lease\`-velden (\`trialEndsAt\`, \`endDate\`, \`noticePeriodDays\`, \`minimumTermMonths\`) — server-side berekend, geen \`localStorage\`.

## UX-richtlijnen
- Tijdig en niet-spammerig: één melding per mijlpaal, gegroepeerd.
- Urgentie zichtbaar via kleur; afgehandelde items verdwijnen netjes.

## Acceptatie
- Relevante partij krijgt tijdig een melding per mijlpaal, in bel én dashboardpaneel.
- Meldingen zijn markeerbaar als gelezen; teller klopt.

**Afhankelijkheden:** Lease 06. **Size:** M
EOF
)"

echo "Alle issues bijgewerkt."
EOF_GUARD=1
