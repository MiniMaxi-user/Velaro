-- Redesign: eigenaar én bereider als account-gekoppelde rollen op één koppeling.
--
-- HorseOwner wordt HorsePerson met twee rolvlaggen (isOwner / isRider). Bestaande
-- HorseOwner-rijen worden behouden en krijgen isOwner = true (en isRider = false),
-- zodat geen enkele eigenaar-koppeling verloren gaat.
--
-- HorseRider was accountloos (vrije velden, geen userId) en kan een bereider die kan
-- inloggen niet representeren; de tabel vervalt. Datamigratie van bereiders is niet
-- nodig (PBI #96, scope).

-- Hernoem HorseOwner -> HorsePerson met behoud van data en relaties.
ALTER TABLE "HorseOwner" RENAME TO "HorsePerson";

-- Voeg de rolvlaggen toe.
ALTER TABLE "HorsePerson" ADD COLUMN "isOwner" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "HorsePerson" ADD COLUMN "isRider" BOOLEAN NOT NULL DEFAULT false;

-- Bestaande koppelingen waren eigenaren.
UPDATE "HorsePerson" SET "isOwner" = true;

-- Hernoem primary key, indexen en foreign keys naar de nieuwe modelnaam.
ALTER TABLE "HorsePerson" RENAME CONSTRAINT "HorseOwner_pkey" TO "HorsePerson_pkey";
ALTER INDEX "HorseOwner_userId_idx" RENAME TO "HorsePerson_userId_idx";
ALTER INDEX "HorseOwner_horseId_userId_key" RENAME TO "HorsePerson_horseId_userId_key";
ALTER TABLE "HorsePerson" RENAME CONSTRAINT "HorseOwner_horseId_fkey" TO "HorsePerson_horseId_fkey";
ALTER TABLE "HorsePerson" RENAME CONSTRAINT "HorseOwner_userId_fkey" TO "HorsePerson_userId_fkey";

-- Verwijder de accountloze bereider-tabel.
ALTER TABLE "HorseRider" DROP CONSTRAINT "HorseRider_horseId_fkey";
DROP TABLE "HorseRider";
