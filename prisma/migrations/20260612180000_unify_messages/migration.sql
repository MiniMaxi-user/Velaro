-- Unify StableNote + StableNoteRead + StableAnnouncement into a generic Message model.
-- Bestaande data wordt gemigreerd met een standaard-onderwerp; gelezen-status blijft behouden.

-- CreateTable
CREATE TABLE "Message" (
    "id" UUID NOT NULL,
    "stableId" UUID,
    "horseId" UUID,
    "authorId" UUID NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageRead" (
    "id" UUID NOT NULL,
    "messageId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageRead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Message_stableId_idx" ON "Message"("stableId");

-- CreateIndex
CREATE INDEX "Message_horseId_idx" ON "Message"("horseId");

-- CreateIndex
CREATE INDEX "MessageRead_userId_idx" ON "MessageRead"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MessageRead_messageId_userId_key" ON "MessageRead"("messageId", "userId");

-- Exactly one target (stable XOR horse)
ALTER TABLE "Message" ADD CONSTRAINT "Message_target_check"
    CHECK (("stableId" IS NOT NULL) <> ("horseId" IS NOT NULL));

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_stableId_fkey" FOREIGN KEY ("stableId") REFERENCES "Stable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_horseId_fkey" FOREIGN KEY ("horseId") REFERENCES "Horse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageRead" ADD CONSTRAINT "MessageRead_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageRead" ADD CONSTRAINT "MessageRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Data migratie ────────────────────────────────────────────────────────────

-- Stalberichten → Message (id hergebruikt; geen botsing met note-ids)
INSERT INTO "Message" ("id", "stableId", "horseId", "authorId", "subject", "body", "createdAt", "updatedAt")
SELECT "id", "stableId", NULL, "authorId", 'Stalbericht', "message", "createdAt", "createdAt"
FROM "StableAnnouncement";

-- Paard-mededelingen → Message (id hergebruikt zodat gelezen-status meekan)
INSERT INTO "Message" ("id", "stableId", "horseId", "authorId", "subject", "body", "createdAt", "updatedAt")
SELECT "id", NULL, "horseId", "authorId", 'Mededeling', "message", "createdAt", "createdAt"
FROM "StableNote";

-- Gelezen-status → MessageRead (noteId == nieuwe messageId)
INSERT INTO "MessageRead" ("id", "messageId", "userId", "readAt")
SELECT "id", "noteId", "userId", "readAt"
FROM "StableNoteRead";

-- ── Oude tabellen verwijderen ────────────────────────────────────────────────

DROP TABLE "StableNoteRead";
DROP TABLE "StableNote";
DROP TABLE "StableAnnouncement";
