-- CreateEnum
CREATE TYPE "PerfilMembro" AS ENUM ('ADMINISTRADOR', 'CANTOR', 'MUSICO', 'BACKING_VOCAL');

-- CreateEnum
CREATE TYPE "StatusMembro" AS ENUM ('ATIVO', 'INATIVO');

-- CreateEnum
CREATE TYPE "StatusCulto" AS ENUM ('ABERTO', 'FECHADO', 'REALIZADO');

-- CreateEnum
CREATE TYPE "TipoCulto" AS ENUM ('CULTO_DOMINGO_MANHA', 'CULTO_DOMINGO_NOITE', 'CULTO_SEMANA', 'ENSAIO', 'SEMANA_ORACAO', 'ESPECIAL', 'OUTRO');

-- CreateEnum
CREATE TYPE "StatusMusica" AS ENUM ('ATIVA', 'ARQUIVADA');

-- CreateTable
CREATE TABLE "Igreja" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "logo" TEXT,
    "site" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Igreja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membro" (
    "id" TEXT NOT NULL,
    "igrejaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT,
    "fotoPerfil" TEXT,
    "perfil" "PerfilMembro" NOT NULL,
    "instrumentoPrincipal" TEXT,
    "instrumentoSecundario" TEXT,
    "fazBackingVocal" BOOLEAN NOT NULL DEFAULT false,
    "status" "StatusMembro" NOT NULL DEFAULT 'ATIVO',
    "dataIngresso" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Membro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Culto" (
    "id" TEXT NOT NULL,
    "igrejaId" TEXT NOT NULL,
    "tipo" "TipoCulto" NOT NULL,
    "subtipo" TEXT,
    "dataHoraInicio" TIMESTAMP(3) NOT NULL,
    "dataHoraFim" TIMESTAMP(3),
    "cantorId" TEXT,
    "status" "StatusCulto" NOT NULL DEFAULT 'ABERTO',
    "inscricoesAbertas" BOOLEAN NOT NULL DEFAULT true,
    "prazoCancelamentoHoras" INTEGER NOT NULL DEFAULT 48,
    "repetirSemanal" BOOLEAN NOT NULL DEFAULT false,
    "observacoesInternas" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Culto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LimiteInstrumento" (
    "id" TEXT NOT NULL,
    "cultoId" TEXT NOT NULL,
    "instrumento" TEXT NOT NULL,
    "limite" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "LimiteInstrumento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InscricaoCulto" (
    "id" TEXT NOT NULL,
    "membroId" TEXT NOT NULL,
    "cultoId" TEXT NOT NULL,
    "instrumento" TEXT NOT NULL,
    "fazBacking" BOOLEAN NOT NULL DEFAULT false,
    "ausente" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InscricaoCulto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Musica" (
    "id" TEXT NOT NULL,
    "igrejaId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "artista" TEXT,
    "bpm" INTEGER,
    "linkVideo" TEXT,
    "linkCifra" TEXT,
    "linkPartitura" TEXT,
    "status" "StatusMusica" NOT NULL DEFAULT 'ATIVA',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Musica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MusicaCantor" (
    "id" TEXT NOT NULL,
    "musicaId" TEXT NOT NULL,
    "cantorId" TEXT NOT NULL,
    "tom" TEXT NOT NULL,
    "linkSolo" TEXT,
    "linkPlayback" TEXT,

    CONSTRAINT "MusicaCantor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Repertorio" (
    "id" TEXT NOT NULL,
    "cultoId" TEXT NOT NULL,
    "cantorId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Repertorio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemRepertorio" (
    "id" TEXT NOT NULL,
    "repertorioId" TEXT NOT NULL,
    "musicaId" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "tomUsado" TEXT,
    "observacoes" TEXT,

    CONSTRAINT "ItemRepertorio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Membro_email_igrejaId_key" ON "Membro"("email", "igrejaId");

-- CreateIndex
CREATE UNIQUE INDEX "LimiteInstrumento_cultoId_instrumento_key" ON "LimiteInstrumento"("cultoId", "instrumento");

-- CreateIndex
CREATE UNIQUE INDEX "InscricaoCulto_membroId_cultoId_key" ON "InscricaoCulto"("membroId", "cultoId");

-- CreateIndex
CREATE UNIQUE INDEX "MusicaCantor_musicaId_cantorId_key" ON "MusicaCantor"("musicaId", "cantorId");

-- CreateIndex
CREATE UNIQUE INDEX "Repertorio_cultoId_key" ON "Repertorio"("cultoId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemRepertorio_repertorioId_ordem_key" ON "ItemRepertorio"("repertorioId", "ordem");

-- AddForeignKey
ALTER TABLE "Membro" ADD CONSTRAINT "Membro_igrejaId_fkey" FOREIGN KEY ("igrejaId") REFERENCES "Igreja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Culto" ADD CONSTRAINT "Culto_igrejaId_fkey" FOREIGN KEY ("igrejaId") REFERENCES "Igreja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LimiteInstrumento" ADD CONSTRAINT "LimiteInstrumento_cultoId_fkey" FOREIGN KEY ("cultoId") REFERENCES "Culto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InscricaoCulto" ADD CONSTRAINT "InscricaoCulto_membroId_fkey" FOREIGN KEY ("membroId") REFERENCES "Membro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InscricaoCulto" ADD CONSTRAINT "InscricaoCulto_cultoId_fkey" FOREIGN KEY ("cultoId") REFERENCES "Culto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Musica" ADD CONSTRAINT "Musica_igrejaId_fkey" FOREIGN KEY ("igrejaId") REFERENCES "Igreja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MusicaCantor" ADD CONSTRAINT "MusicaCantor_musicaId_fkey" FOREIGN KEY ("musicaId") REFERENCES "Musica"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MusicaCantor" ADD CONSTRAINT "MusicaCantor_cantorId_fkey" FOREIGN KEY ("cantorId") REFERENCES "Membro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Repertorio" ADD CONSTRAINT "Repertorio_cultoId_fkey" FOREIGN KEY ("cultoId") REFERENCES "Culto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Repertorio" ADD CONSTRAINT "Repertorio_cantorId_fkey" FOREIGN KEY ("cantorId") REFERENCES "Membro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemRepertorio" ADD CONSTRAINT "ItemRepertorio_repertorioId_fkey" FOREIGN KEY ("repertorioId") REFERENCES "Repertorio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemRepertorio" ADD CONSTRAINT "ItemRepertorio_musicaId_fkey" FOREIGN KEY ("musicaId") REFERENCES "Musica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
