/*
  Warnings:

  - A unique constraint covering the columns `[insCode,minute]` on the table `PriceSnapshotMinute` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "PriceSnapshotMinute_insCode_minute_key" ON "public"."PriceSnapshotMinute"("insCode", "minute");
