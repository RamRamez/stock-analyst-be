-- CreateTable
CREATE TABLE "public"."Instrument" (
    "insCode" TEXT NOT NULL,
    "isin" TEXT,
    "symbol" TEXT,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Instrument_pkey" PRIMARY KEY ("insCode")
);

-- CreateTable
CREATE TABLE "public"."PriceSnapshotMinute" (
    "id" SERIAL NOT NULL,
    "insCode" TEXT NOT NULL,
    "minute" TIMESTAMP(3) NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceSnapshotMinute_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PriceSnapshotMinute_insCode_minute_idx" ON "public"."PriceSnapshotMinute"("insCode", "minute");

-- AddForeignKey
ALTER TABLE "public"."PriceSnapshotMinute" ADD CONSTRAINT "PriceSnapshotMinute_insCode_fkey" FOREIGN KEY ("insCode") REFERENCES "public"."Instrument"("insCode") ON DELETE CASCADE ON UPDATE CASCADE;
