-- CreateTable
CREATE TABLE "StableAnnouncement" (
    "id" UUID NOT NULL,
    "stableId" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StableAnnouncement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StableAnnouncement_stableId_idx" ON "StableAnnouncement"("stableId");

-- AddForeignKey
ALTER TABLE "StableAnnouncement" ADD CONSTRAINT "StableAnnouncement_stableId_fkey" FOREIGN KEY ("stableId") REFERENCES "Stable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StableAnnouncement" ADD CONSTRAINT "StableAnnouncement_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
