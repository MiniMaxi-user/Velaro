# Voorstel 1

Type: VERBETERING

---

## Wat ontbreekt

Op het paardenprofiel staan drie gezondheidsblokken (vaccinaties, ontworming,
dierenartsenbezoeken) die elk alleen een "Toevoegen"-knop hebben. Verwijderen
werkt al (DeleteGezondheidButton), maar bewerken ontbreekt volledig. Als een
medewerker een datum of vaccinnaam verkeerd intypt, is de enige oplossing:
verwijderen en opnieuw invoeren. Alle ingevoerde notities gaan dan verloren.

Dit is een klassieke klantfrustratie bij SaaS in de zorg/beheer-sfeer.

---

## Waarom waardevol voor de doelgroep (pensionstallen)

Pensionstallen moeten gezondheidsregistraties bijhouden voor:
- EU-slachtuitsluitingsdocumentatie (UELN/paspoort-koppeling)
- Aantoonbaarheid bij wedstrijden (vaccinatieboekje)
- Communicatie richting paardeneigenaren

Een fout in een vaccinatiedatum of productnaam moet snel gecorrigeerd kunnen
worden zonder dataverlies. Het ontbreken van bewerkfunctionaliteit maakt de
gezondheidsmodule onbetrouwbaar in dagelijks gebruik en ondermijnt het
vertrouwen in het platform als geheel.

Businessplan-aansluiting: het businessplan noemt "Gebruiksgemak" als
succesfactor en "Gezondheidsregistratie" als MVP-onderdeel (bouwvolgorde stap 3).
Een registratiemodule zonder bewerkfunctie is niet volledig.

---

## Wat gebouwd moet worden

Scope: drie routes, drie queries, drie server actions, formulieren uitbreiden.
Eén patroon, drie keer toegepast (vaccinatie, ontworming, dierenarts).

### 1. Nieuwe routes

```
src/app/(app)/paarden/[id]/vaccinaties/[vaccinatieId]/bewerken/page.tsx
src/app/(app)/paarden/[id]/ontworming/[ontwormingId]/bewerken/page.tsx
src/app/(app)/paarden/[id]/dierenarts/[bezoekId]/bewerken/page.tsx
```

Elke page-component: laadt de bestaande rij via een query, controleert
canEdit (stableMember), geeft het formulier mee met defaultValues.

### 2. Queries uitbreiden in src/features/gezondheid/queries.ts

Drie nieuwe losse queries toevoegen:
- getVaccinatie(id: string)
- getOntworming(id: string)
- getDierenartsBezzoek(id: string)

### 3. Server actions uitbreiden in src/features/gezondheid/actions.ts

Drie nieuwe actions naast de bestaande create-actions:
- updateVaccinatie(id, horseId, formData)
- updateOntworming(id, horseId, formData)
- updateDierenartsBezzoek(id, horseId, formData)

Elke action: autorisatiecheck (getStableRole), prisma.[model].update(...),
daarna redirect naar /paarden/[horseId].

### 4. Formuliercomponenten aanpassen

VaccinatieForm, OntwormingForm en DierenartsBezoekreForm uitbreiden met
een optionele defaultValues-prop zodat ze in beide modi werken
(aanmaken zonder prop, bewerken met prop).

### 5. Bewerk-knop toevoegen op de rijen

In src/app/(app)/paarden/[id]/page.tsx: naast de bestaande
DeleteGezondheidButton een Link-knop toevoegen naar de bewerkroute,
alleen zichtbaar als canEdit true is.

---

## Acceptatiecriterium

1. Een staleigenaar of medewerker kan een bestaande vaccinatie openen,
   de datum en het type aanpassen, en opslaan. Na opslaan verschijnen
   de gewijzigde gegevens in de tabel op het paardenprofiel.
2. Hetzelfde geldt voor ontworming en dierenartsenbezoeken.
3. Een paardeneigenaar (geen stableMember) ziet de bewerkknop niet en
   krijgt een 404 als hij de bewerkroute direct bezoekt.
4. Geen schemawijziging nodig: alle benodigde velden bestaan al in
   Vaccination, Deworming en VetVisit.
