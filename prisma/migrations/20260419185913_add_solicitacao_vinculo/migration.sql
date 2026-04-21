-- CreateEnum
CREATE TYPE "StatusSolicitacao" AS ENUM ('PENDENTE', 'APROVADA', 'RECUSADA');

-- CreateTable
CREATE TABLE "SolicitacaoVinculo" (
    "id" TEXT NOT NULL,
    "igrejaId" TEXT NOT NULL,
    "musicaId" TEXT NOT NULL,
    "cantorId" TEXT NOT NULL,
    "tomSugerido" TEXT,
    "status" "StatusSolicitacao" NOT NULL DEFAULT 'PENDENTE',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SolicitacaoVinculo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SolicitacaoVinculo_musicaId_cantorId_key" ON "SolicitacaoVinculo"("musicaId", "cantorId");

-- AddForeignKey
ALTER TABLE "SolicitacaoVinculo" ADD CONSTRAINT "SolicitacaoVinculo_musicaId_fkey" FOREIGN KEY ("musicaId") REFERENCES "Musica"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitacaoVinculo" ADD CONSTRAINT "SolicitacaoVinculo_cantorId_fkey" FOREIGN KEY ("cantorId") REFERENCES "Membro"("id") ON DELETE CASCADE ON UPDATE CASCADE;
