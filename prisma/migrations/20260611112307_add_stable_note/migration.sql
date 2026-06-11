-- CreateTable
CREATE TABLE "StableNote" (
    "id" UUID NOT NULL,
    "horseId" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StableNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StableNote_horseId_idx" ON "StableNote"("horseId");

-- AddForeignKey
ALTER TABLE "StableNote" ADD CONSTRAINT "StableNote_horseId_fkey" FOREIGN KEY ("horseId") REFERENCES "Horse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StableNote" ADD CONSTRAINT "StableNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
