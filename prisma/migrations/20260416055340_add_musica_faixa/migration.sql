/*
  Warnings:

  - You are about to drop the column `linkPlayback` on the `MusicaCantor` table. All the data in the column will be lost.
  - You are about to drop the column `linkSolo` on the `MusicaCantor` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[repertorioId,musicaId]` on the table `ItemRepertorio` will be added. If there are existing duplicate values, this will fail.
  - Made the column `tomUsado` on table `ItemRepertorio` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "ItemRepertorio_repertorioId_ordem_key";

-- AlterTable
ALTER TABLE "ItemRepertorio" ALTER COLUMN "ordem" DROP NOT NULL,
ALTER COLUMN "tomUsado" SET NOT NULL;

-- AlterTable
ALTER TABLE "MusicaCantor" DROP COLUMN "linkPlayback",
DROP COLUMN "linkSolo";

-- CreateTable
CREATE TABLE "MusicaFaixa" (
    "id" TEXT NOT NULL,
    "musicaCantorId" TEXT NOT NULL,
    "instrumento" TEXT NOT NULL,
    "linkAudio" TEXT NOT NULL,

    CONSTRAINT "MusicaFaixa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ItemRepertorio_repertorioId_musicaId_key" ON "ItemRepertorio"("repertorioId", "musicaId");

-- AddForeignKey
ALTER TABLE "MusicaFaixa" ADD CONSTRAINT "MusicaFaixa_musicaCantorId_fkey" FOREIGN KEY ("musicaCantorId") REFERENCES "MusicaCantor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
