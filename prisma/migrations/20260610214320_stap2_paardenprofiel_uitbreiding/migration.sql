-- AlterTable
ALTER TABLE "Horse" ADD COLUMN     "damName" TEXT,
ADD COLUMN     "discipline" TEXT,
ADD COLUMN     "disciplineLevel" TEXT,
ADD COLUMN     "excludedFromConsumption" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "excludedFromConsumptionDate" TIMESTAMP(3),
ADD COLUMN     "passportNumber" TEXT,
ADD COLUMN     "sireName" TEXT,
ADD COLUMN     "ueln" TEXT;
