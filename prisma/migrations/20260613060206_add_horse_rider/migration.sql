-- CreateTable
CREATE TABLE "HorseRider" (
    "id" UUID NOT NULL,
    "horseId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "phone" TEXT,
    "email" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HorseRider_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HorseRider_horseId_idx" ON "HorseRider"("horseId");

-- AddForeignKey
ALTER TABLE "HorseRider" ADD CONSTRAINT "HorseRider_horseId_fkey" FOREIGN KEY ("horseId") REFERENCES "Horse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
