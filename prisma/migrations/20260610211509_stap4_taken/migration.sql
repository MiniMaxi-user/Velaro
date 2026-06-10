-- CreateTable
CREATE TABLE "Task" (
    "id" UUID NOT NULL,
    "stableId" UUID NOT NULL,
    "horseId" UUID,
    "title" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Task_stableId_date_idx" ON "Task"("stableId", "date");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_stableId_fkey" FOREIGN KEY ("stableId") REFERENCES "Stable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_horseId_fkey" FOREIGN KEY ("horseId") REFERENCES "Horse"("id") ON DELETE SET NULL ON UPDATE CASCADE;
