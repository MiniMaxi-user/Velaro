#!/usr/bin/env bash
set -euo pipefail

REPO="MiniMaxi-user/velaro"
OWNER="MiniMaxi-user"
PROJECT_NUMBER=2
PROJECT_ID="PVT_kwHOBJnhiM4BaXsM"
STATUS_FIELD_ID="PVTSSF_lAHOBJnhiM4BaXsMzhVPyiQ"
BACKLOG_OPT="f75ad846"

add_to_backlog () {
  local url="$1"
  local item_id
  item_id=$(gh project item-add "$PROJECT_NUMBER" --owner "$OWNER" --url "$url" --format json --jq '.id')
  gh project item-edit --project-id "$PROJECT_ID" --id "$item_id" \
    --field-id "$STATUS_FIELD_ID" --single-select-option-id "$BACKLOG_OPT" >/dev/null
  echo "  -> backlog ($item_id)"
}

create_issue () {
  local title="$1"; local body="$2"
  local url
  url=$(gh issue create --repo "$REPO" --label lease --title "$title" --body "$body")
  echo "Created: $url"
  add_to_backlog "$url"
}

# Reeds aangemaakt in vorige run — alleen backlog-status borgen.
echo "Backlog borgen voor bestaande issues #59 (epic) en #60 (story 01)..."
add_to_backlog "https://github.com/MiniMaxi-user/velaro/issues/59"
add_to_backlog "https://github.com/MiniMaxi-user/velaro/issues/60"

EPIC_NUM=59
ref="Onderdeel van epic #$EPIC_NUM."

# ── Story 02 ──────────────────────────────────────────────────────────────────
create_issue "[Lease 02] Autorisatie: leaser-rol & toegang eigen geleased paard" "$(cat <<EOF
$ref

**Doel:** een leaser (gekoppeld via een actieve \`Lease\`) krijgt — net als een paardeneigenaar — **lees**toegang tot het profiel van zijn/haar geleasede paard.

## Scope
- Autorisatie-helpers in \`src/lib/auth/\` uitbreiden: "mag gebruiker U paard H zien?" wordt ook \`true\` als U een **actieve** \`Lease\` op H heeft.
- Toegang is rolafhankelijk: leaser ziet relevante onderdelen (algemeen, gezondheid, voederschema) maar krijgt geen stalbeheer-rechten.
- Eigenaar/stal-OWNER/STAFF behouden bestaande rechten.

## Acceptatie
- Een ingelogde leaser ziet het paardprofiel van het geleasede paard; geen toegang tot andere paarden of stalbeheer.
- Niet-leasers zien niets extra's.
- Autorisatie afgedwongen in app-laag (server), niet alleen UI-verbergen.

**Afhankelijkheden:** Lease 01.
**Size:** M
EOF
)"

# ── Story 03 ──────────────────────────────────────────────────────────────────
create_issue "[Lease 03] Marktplaats: lease-aanbod beheren (CRUD listing)" "$(cat <<EOF
$ref

**Doel:** eigenaar/stal kan een lease-**aanbod** (\`LeaseListing\`) aanmaken, bewerken, (de)activeren en verwijderen, gekoppeld aan een bestaand paardprofiel.

## Scope
- Route(s) onder \`src/app/(app)/\` voor het beheren van listings van een paard.
- Formulier met velden uit \`LeaseListing\`: leasetype, dagen/week, prijs p/m, regio, discipline, "mag verplaatst worden", exclusief/gedeeld, omschrijving.
- Alleen OWNER/STAFF van de stal (of paardeneigenaar) mag een listing aanmaken/bewerken.
- Listing-status \`isActive\` bepaalt of het aanbod publiek zichtbaar is (zie Lease 04).

## Acceptatie
- CRUD werkt met server actions; validatie op verplichte velden.
- Een listing is zichtbaar vanaf het paardprofiel.

**Afhankelijkheden:** Lease 01.
**Size:** M
EOF
)"

# ── Story 04 ──────────────────────────────────────────────────────────────────
create_issue "[Lease 04] Marktplaats: overzicht, filters & matching-score" "$(cat <<EOF
$ref

**Doel:** een overzichtspagina met alle actieve lease-listings, met filters en een eenvoudige matching-score (zoals HorseDeal).

## Scope
- Overzichtsroute met kaartweergave van actieve listings (foto, paard, leasetype, prijs, regio).
- Filters: discipline, niveau, dagen/week, regio, prijsrange, leasetype, "mag verplaatst worden".
- Eenvoudige matching-/relevantiescore op basis van filtervoorkeuren (geen ML — gewogen criteria).
- Detailweergave van een listing met "interesse tonen"-cta (haakt op Lease 05).

## Acceptatie
- Filters werken server-side; alleen \`isActive\` listings zichtbaar.
- Score-sortering aantoonbaar; lege staat netjes afgehandeld.

**Afhankelijkheden:** Lease 03.
**Size:** L
EOF
)"

# ── Story 05 ──────────────────────────────────────────────────────────────────
create_issue "[Lease 05] Communicatie: interesse tonen & in-app contact" "$(cat <<EOF
$ref

**Doel:** een geinteresseerde leaser kan laagdrempelig in contact komen met de aanbieder — dé pijn die Marktplaats/Facebook niet goed oplossen.

## Scope
- "Interesse tonen" op een listing start een in-app gesprek tussen geinteresseerde en aanbieder.
- Bouw waar mogelijk voort op de bestaande \`Message\`/\`MessageRead\`-infrastructuur (1-op-1 i.p.v. stal/paard-broadcast) — of een lichte \`LeaseInquiry\`-thread; kies en motiveer in PR.
- Notificatie/ongelezen-indicator voor nieuwe berichten.

## Acceptatie
- Aanbieder ontvangt en kan reageren op interesse; beide partijen zien de thread.
- Toegang correct afgeschermd (alleen de twee partijen).

**Afhankelijkheden:** Lease 04 (en bestaande Message-infra).
**Size:** L
EOF
)"

# ── Story 06 ──────────────────────────────────────────────────────────────────
create_issue "[Lease 06] Contracttemplates per variant + digitale ondertekening" "$(cat <<EOF
$ref

**Doel:** kant-en-klare, aankruisbare contracttemplates per leasevariant met digitale ondertekening. Begin met **deellease + full lease** (grootste volume).

## Scope
- Contracttemplate-structuur op basis van de FNRS-artikelstructuur (zie marktonderzoek sectie 4): partijen, paard, duur/proeftijd, gebruiksrecht, disciplines, kostenverdeling, leasevergoeding, aansprakelijkheid, verzekering, opzegging, eerste recht van koop, minderjarigheid.
- Aankruisbare opties (kostenverdeling, disciplines, opzegtermijn, eerste recht van koop).
- Genereer een ondertekenbaar document; leg ondertekening + datum vast (koppel aan \`Lease\`).
- **Disclaimer:** geen juridische garantie; juridische review vereist voordat templates live gaan (zie caveats).

## Acceptatie
- Een lease kan met een ingevuld template worden vastgelegd en (digitaal) ondertekend.
- Minimaal deellease + full lease templates beschikbaar.

**Afhankelijkheden:** Lease 01 (Lease-model), Lease 02.
**Size:** XL
EOF
)"

# ── Story 07 ──────────────────────────────────────────────────────────────────
create_issue "[Lease 07] Kostenverdeling & betaaladministratie" "$(cat <<EOF
$ref

**Doel:** maandelijkse leasevergoeding + splitsing van kostenposten administreren, met btw-afhandeling.

## Scope
- Datamodel: kostenposten per lease (hoefsmid, dierenarts, voer, stalling, tuig) met wie betaalt; maandelijkse leasevergoeding.
- Btw-flag: lease = 21% (zakelijk verleaser/manege), met juiste weergave op factuur (sport/sportaccommodatie 9% expliciet uitgesloten voor lease).
- Maandelijkse vergoeding/facturatie-overzicht; onvoorziene/grote dierenartskosten apart kunnen markeren (belangrijkste twistpunt).
- (Echte incasso/PSP-koppeling buiten scope van deze story — alleen administratie/overzicht; markeer als follow-up.)

## Acceptatie
- Per lease zijn vergoeding + kostenverdeling + btw zichtbaar en correct.
- Maandoverzicht per partij.

**Afhankelijkheden:** Lease 06 (lease vastgelegd). Sluit aan op latere facturatie-stap (bouwvolgorde 6).
**Size:** L
EOF
)"

# ── Story 08 ──────────────────────────────────────────────────────────────────
create_issue "[Lease 08] Verzekering- & aansprakelijkheidsregistratie (6:179 BW)" "$(cat <<EOF
$ref

**Doel:** onderscheidend vertrouwens-/veiligheidskenmerk: aansprakelijkheid (art. 6:179 BW) en verzekering expliciet vastleggen per lease.

## Scope
- Verplicht veld per lease: "is leaser meeverzekerd op de WA/AVP-polis van de eigenaar?" (zie LG Munchen I: gedeelde lease sluit aansprakelijkheid niet automatisch uit).
- Upload/registratie van polissen (WA/AVP, ongevallen ruiter, ziektekosten-/cascoverzekering paard).
- Checklist 6:179 BW bij het aangaan van een lease; waarschuwing als meeverzekering ontbreekt.

## Acceptatie
- Lease kan niet als "actief" worden voltooid zonder beantwoording van de meeverzekerd-vraag (of expliciete bevestiging van het risico).
- Polissen zichtbaar voor betrokken partijen.

**Afhankelijkheden:** Lease 06.
**Size:** M
EOF
)"

# ── Story 09 ──────────────────────────────────────────────────────────────────
create_issue "[Lease 09] Gedeelde beschikbaarheidskalender (deellease)" "$(cat <<EOF
$ref

**Doel:** bij deellease/gedeeld gebruik voorkomen dat meerdere partijen tegelijk willen rijden — wie rijdt welke dag.

## Scope
- Kalender per paard met geclaimde/toegewezen dagdelen per leaser/eigenaar.
- Conflictpreventie: dubbele claim op hetzelfde moment wordt geweigerd of gemarkeerd.
- Afgeleid van het weekschema in het lease-contract (dagen/week, exclusief vs. gedeeld).

## Acceptatie
- Leaser kan beschikbare momenten zien en claimen; conflicten worden voorkomen.
- Eigenaar houdt overzicht over alle claims van het paard.

**Afhankelijkheden:** Lease 02, Lease 06.
**Size:** L
EOF
)"

# ── Story 10 ──────────────────────────────────────────────────────────────────
create_issue "[Lease 10] Mijlpaal-/notificatiemotor (opzeg/verleng/proef + herinneringen)" "$(cat <<EOF
$ref

**Doel:** automatische alerts rond de lease-levenscyclus, voor retentie en om deadlines niet te missen.

## Scope
- Notificaties/alerts voor: einde proefperiode, naderende einddatum/minimumduur, opzegtermijn-deadline, stilzwijgende verlenging, en gekoppelde paardgebonden herinneringen (vaccinatie/hoefsmid) voor de leaser.
- Sluit aan op bestaande meldingen-bel (topbar) en \`MessageRead\`-patroon waar mogelijk.
- Afleiden uit \`Lease\`-velden (\`trialEndsAt\`, \`endDate\`, \`noticePeriodDays\`, \`minimumTermMonths\`).

## Acceptatie
- Relevante partij krijgt tijdig een melding voor elke mijlpaal.
- Meldingen zijn markeerbaar als gelezen.

**Afhankelijkheden:** Lease 06 (lease-levenscyclus vastgelegd).
**Size:** M
EOF
)"

echo "Klaar."
