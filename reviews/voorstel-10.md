# Voorstel 10 - Reacties van paardeneigenaren op mededelingen

Type: UITBREIDING

---

## Wat de klant mist

De mededelingenfunctie is een eenrichtingskanaal: de stal plaatst berichten,
de paardeneigenaar leest ze. Er is geen manier voor de paardeneigenaar om te
reageren. Niet om een vraag te stellen, niet om een bericht te bevestigen,
niet om extra informatie te geven.

Concreet voorbeeld: de stal schrijft dat Storm een warm been heeft en twee
dagen rust krijgt. De eigenaar wil reageren met een vraag of een bevestiging.
Op dit moment pakt die eigenaar de telefoon of stuurt een WhatsApp. De
mededeling in Velaro blijft een monoloog.

De staleigenaar ziet bovendien niet of de eigenaar de mededeling uberhaupt
heeft gelezen. De communicatielijn werkt in een richting.

---

## Waarom waardevol voor de doelgroep (pensionstallen)

Pensionstallen onderhouden dagelijks contact met eigenaren. Het huidige model
dwingt eigenaren terug naar WhatsApp of telefoon zodra ze willen reageren.
Dat ondermijnt precies de reden waarom een stal Velaro aanschaft: een plek
voor alle communicatie rondom het paard.

Een reactiemogelijkheid creert een aantoonbare lus: eigenaar leest bericht,
eigenaar reageert, stal ziet reactie. Alles in Velaro, alles traceerbaar,
alles gekoppeld aan het paardenprofiel.

Businessplan-aansluiting:
- Communicatie staat als MVP-onderdeel 3 (businessplan). Een
  eenrichtingskanaal is geen communicatie maar een mededelingenbord.
  Tweerichtingsverkeer maakt van de functie een echte communicatietool.
- Netwerkeffecten zijn een succesfactor (businessplan). Eigenaren die actief
  terugschrijven komen vaker in de app. Meer actieve gebruikers = hogere
  retentie = sterkere SaaS-metrics voor Velaro.
- Mobiele ervaring als succesfactor (businessplan): eigenaren zijn onderweg.
  Een snelle reactie typen is precies het mobiele gebruikspatroon dat de
  app waardevoller maakt dan een WhatsApp-groep.
- Bouwvolgorde stap 5 in CLAUDE.md: Eigenaarscommunicatie plus gedeeld
  profiel. De eigenaar kan al meelezen, maar communicatie impliceert
  tweerichtingen. Reacties voltooien stap 5 inhoudelijk.

---

## Concrete implementatie-instructies

Scope: nieuw StableNoteReply-model, twee server actions, uitbreiding van
de mededelingen-query en twee UI-wijzigingen. Geen nieuwe routes.

### 1. Schema-uitbreiding in prisma/schema.prisma

Nieuw model toevoegen na StableNote:

    model StableNoteReply {
      id        String   @id @default(uuid()) @db.Uuid
      noteId    String   @db.Uuid
      authorId  String   @db.Uuid
      message   String
      createdAt DateTime @default(now())

      note   StableNote @relation(fields: [noteId], references: [id], onDelete: Cascade)
      author User       @relation(fields: [authorId], references: [id], onDelete: Cascade)

      @@index([noteId])
    }

Aan StableNote toevoegen: replies StableNoteReply[]
Aan User toevoegen:        stableNoteReplies StableNoteReply[]

Uitvoeren na de wijziging:
    npx prisma migrate dev --name add-stable-note-replies

### 2. Query uitbreiden in src/features/mededelingen/queries.ts

De bestaande getNotesForHorse-query krijgt replies erbij via include:

    replies: {
      orderBy: { createdAt: 'asc' },
      include: { author: { select: { name: true, email: true } } },
    }

De aanroep in eigenaar/page.tsx geeft al 2 notities terug en toont alleen
de noot-tekst; de eigenaar-startview hoeft geen replies te renderen.

### 3. Server actions in src/features/mededelingen/actions.ts

Voeg createReply en deleteReply toe na de bestaande actions.

createReply(noteId, horseId, formData):
- Controleer authenticatie via supabase.auth.getUser().
- Controleer autorisatie via canViewHorse(user.id, horseId).
- Haal message op uit formData.get('reply'), trim, valideer niet-leeg.
- Sla op via prisma.stableNoteReply.create.
- Roep revalidatePath aan voor /paarden/[horseId].

deleteReply(replyId, horseId):
- Controleer authenticatie.
- Haal reply op via prisma.stableNoteReply.findUnique.
- Bepaal isAuthor (reply.authorId === user.id).
- Bepaal isOwner via getStableRole op het paard van de noot.
- Gooi Error als niet-auteur en niet-eigenaar.
- Verwijder via prisma.stableNoteReply.delete.
- Roep revalidatePath aan.

### 4. Type-uitbreiding in MededelingenSectie.tsx

Breid de Note-interface uit met:

    interface Reply {
      id: string
      message: string
      createdAt: Date
      authorId: string
      author: { name: string | null; email: string }
    }

    // Voeg toe aan Note-interface:
    replies: Reply[]

### 5. UI: replies tonen per mededeling in MededelingenSectie.tsx

Voeg toe direct na .note-item__message voor elke noot een ingesprongen
reply-thread. Wanneer n.replies.length > 0 toon een .note-replies container
met per Reply een .note-reply blok: auteursnaam, datum, en voor auteur of
OWNER een DeleteReplyButton.

Voeg daarna een ReplyForm-component toe, standaard verborgen achter een
Reageer-knop (useState-toggle). ReplyForm is een apart client-component
(src/features/mededelingen/ReplyForm.tsx) met:
- Een textarea name=reply.
- Een SubmitButton Plaatsen.
- Een Annuleren-knop die de toggle sluit.
- Form action: createReply.bind(null, noteId, horseId).

### 6. Nieuw component src/features/mededelingen/DeleteReplyButton.tsx

Analoog aan DeleteNoteButton (use client, useTransition, confirm-dialoog),
maar roept deleteReply(id, horseId) aan in plaats van deleteNote.

### 7. CSS-klassen toevoegen in src/styles/globals.css

Voeg toe na de bestaande .note-item stijlen:

    .note-replies {
      margin-top: 10px;
      padding-left: 16px;
      border-left: 2px solid var(--velaro-color-border);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .note-reply {
      font-size: var(--velaro-text-sm);
    }

    .note-reply__header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }

    .note-reply__message {
      color: var(--velaro-color-navy);
    }

### Bestanden die wijzigen

- prisma/schema.prisma - StableNoteReply model plus relaties op StableNote en User
- src/features/mededelingen/queries.ts - replies meeladen in getNotesForHorse
- src/features/mededelingen/actions.ts - createReply en deleteReply toevoegen
- src/features/mededelingen/MededelingenSectie.tsx - reply-thread plus ReplyForm
- src/features/mededelingen/ReplyForm.tsx - nieuw component
- src/features/mededelingen/DeleteReplyButton.tsx - nieuw component
- src/styles/globals.css - .note-replies en .note-reply stijlen

### Geen wijzigingen nodig in

- src/app/(app)/eigenaar/page.tsx - getNotesForHorse geeft nu replies mee
  maar de eigenaar-startview toont enkel de noot-tekst; het volledige gesprek
  is bereikbaar via de knop Bekijk profiel
- Alle routes (geen nieuwe pagina)
- EigenaarBeheer.tsx, GezondheidTabs.tsx (geen relatie)

---

## Acceptatiecriteria

1. Een paardeneigenaar ziet op /paarden/[id] onder elke mededeling een
   Reageer-knop. Bij klikken verschijnt een textarea plus Plaatsen-knop.
   Na plaatsen staat de reactie ingesprongen onder de mededeling, zonder
   pagina-refresh.
2. Een staleigenaar of medewerker kan ook reageren op mededelingen; de
   reactieknop is zichtbaar voor iedereen met leestoegang tot het paard.
3. De reactie-auteur kan zijn eigen reactie verwijderen. Een OWNER van
   de stal kan alle reacties verwijderen (zelfde patroon als bij notes).
4. Reacties staan in chronologische volgorde (oudste eerst) onder de
   mededeling waarop ze betrekking hebben.
5. De eigenaar-startpagina (/eigenaar) toont de twee laatste mededelingen
   zoals voorheen, zonder replies. Via Bekijk profiel ziet de eigenaar
   het volledige gesprek inclusief reacties.
6. Prisma-migratie is vereist (een nieuw model: StableNoteReply).
7. Geen nieuwe routes nodig.
