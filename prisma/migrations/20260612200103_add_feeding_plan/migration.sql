-- CreateTable
CREATE TABLE "FeedingPlan" (
    "id" UUID NOT NULL,
    "horseId" UUID NOT NULL,
    "roughage" TEXT,
    "concentrate" TEXT,
    "supplements" TEXT,
    "restrictions" TEXT,
    "notes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FeedingPlan_horseId_key" ON "FeedingPlan"("horseId");

-- AddForeignKey
ALTER TABLE "FeedingPlan" ADD CONSTRAINT "FeedingPlan_horseId_fkey" FOREIGN KEY ("horseId") REFERENCES "Horse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
