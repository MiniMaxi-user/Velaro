-- CreateTable
CREATE TABLE "ContractDocument" (
    "id" UUID NOT NULL,
    "contractId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContractDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContractDocument_contractId_idx" ON "ContractDocument"("contractId");

-- AddForeignKey
ALTER TABLE "ContractDocument" ADD CONSTRAINT "ContractDocument_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;
