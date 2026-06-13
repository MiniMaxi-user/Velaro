# Voorstel 11 - Bevestigingsdialoog bij taak verwijderen

Type: VERBETERING

---

## Wat de klant mist

Op de takenpagina (/stal/taken) staat bij elke taak een rode "Verwijder"-knop.
Deze knop verwijdert de taak direct, zonder bevestigingsvraag. Een misklик is
onomkeerbaar: de taak is weg en er is geen terugzetoptie.

Alle andere verwijderknoppen in de app beschermen de gebruiker met een
confirm()-dialoog:

| Component                        | Bevestiging?          |
|----------------------------------|-----------------------|
| DeletePaardButton                | Ja (confirm)          |
| LidVerwijderenButton             | Ja (confirm)          |
| DeleteGezondheidButton           | Ja (confirm)          |
| DeleteNoteButton                 | Ja (confirm)          |
| TerugkerendeTakenBeheer (sjabloon verwijder) | Ja (confirm) |
| TaakItem (taak verwijder)        | Nee -- ontbreekt      |

De inconsistentie is aantoonbaar: het zojuist gebouwde TerugkerendeTakenBeheer
vraagt wel om bevestiging bij het verwijderen van een sjabloon (regel 63 in
TerugkerendeTakenBeheer.tsx), maar TaakItem -- dat op dezelfde pagina staat --
doet dit niet voor losse taken.

Concreet scenario: een medewerker wil een taak afvinken, mist de checkboxknop
(klein doeloppervlak op mobiel) en raakt de Verwijder-knop. De taak is direct
weg. Als het een door een terugkerend sjabloon gegenereerde taak was, komt die
morgen vanzelf terug -- maar voor eenmalige taken is de informatie verloren.

---

## Waarom waardevol voor de doelgroep (pensionstallen)

Pensionstallen gebruiken de takenpagina dagelijks, vaak op mobiel en in een
drukke omgeving (stal, buiten). De kans op een misklик is reeel. Een eenmalige
taak -- bijv. "Dierenarts bellen voor Storm" of "Zadel meegeven aan eigenaar" --
die per ongeluk wordt verwijderd, kan een concrete consequentie hebben.

Businessplan-aansluiting:
- Gebruiksgemak is een van de vijf genoemde succesfactoren in het businessplan.
  Foutpreventie (een bevestigingsvraag bij een destructieve actie) is een
  basisprincipe van gebruiksgemak.
- Mobiele ervaring staat als succesfactor: op een telefoon is een misklик bij
  kleine knoppen naast elkaar significant waarschijnlijker dan op een desktop.
- CLAUDE.md bouwvolgorde stap 4 (taken/planning) is gebouwd maar incompleet
  zolang destructieve acties inconsistent zijn beveiligd.
- Consistentie binnen de app is een vertrouwensfactor voor de beachhead-
  doelgroep (pensionstallen): als elke andere verwijderknop vraagt om bevestiging
  en deze niet, trekt dat de kwaliteit van het platform in twijfel.

---

## Concrete implementatie-instructies

Scope: één bestand, twee regels toevoegen. Geen nieuwe routes, geen nieuwe
server actions, geen schemawijziging.

### Bestand: src/features/taken/TaakItem.tsx

Huidige handleDelete-functie (regels 33-39):

    function handleDelete() {
      setError(null)
      startDelete(async () => {
        try { await deleteTask(task.id) }
        catch (err) { setError(err instanceof Error ? err.message : 'Fout') }
      })
    }

Nieuwe versie met bevestigingsvraag als eerste stap, analoog aan
TerugkerendeTakenBeheer.handleDelete en LidVerwijderenButton:

    function handleDelete() {
      if (!confirm(`Taak "${task.title}" verwijderen?`)) return
      setError(null)
      startDelete(async () => {
        try { await deleteTask(task.id) }
        catch (err) { setError(err instanceof Error ? err.message : 'Fout') }
      })
    }

Geen andere wijzigingen nodig: de bestaande disabled={deleting}-prop op de knop
blijft correct, de bestaande error-weergave blijft intact.

### Bestanden die wijzigen

- src/features/taken/TaakItem.tsx -- confirm()-aanroep toevoegen in handleDelete

### Geen wijzigingen nodig in

- Prisma-schema
- Server actions (actions.ts)
- queries.ts
- taken/page.tsx
- TerugkerendeTakenBeheer.tsx (heeft confirm al correct)

---

## Acceptatiecriteria

1. Een staleigenaar of medewerker klikt op de rode Verwijder-knop bij een taak.
   Er verschijnt een bevestigingsdialoog met de taakomschrijving, bijv.
   'Taak "Dierenarts bellen" verwijderen?'.
2. Bij Annuleren blijft de taak ongewijzigd in de lijst staan.
3. Bij bevestigen wordt de taak direct verwijderd, zoals voorheen.
4. Het gedrag is nu consistent met alle andere verwijderknoppen in de app.
5. Geen Prisma-migratie nodig.
