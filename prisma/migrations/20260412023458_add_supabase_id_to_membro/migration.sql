/*
  Warnings:

  - A unique constraint covering the columns `[supabaseId]` on the table `Membro` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Membro" ADD COLUMN     "supabaseId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Membro_supabaseId_key" ON "Membro"("supabaseId");
