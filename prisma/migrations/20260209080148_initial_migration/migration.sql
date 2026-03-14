-- CreateEnum
CREATE TYPE "Perfil" AS ENUM ('ADMIN', 'PASTOR', 'TESOUREIRO', 'SECRETARIO', 'MEMBRO');

-- CreateEnum
CREATE TYPE "Genero" AS ENUM ('M', 'F');

-- CreateEnum
CREATE TYPE "MetodoPagamento" AS ENUM ('DINHEIRO', 'TRANSFERENCIA', 'CARTAO');

-- CreateEnum
CREATE TYPE "TipoOferta" AS ENUM ('CULTO', 'EVENTO', 'MISSOES', 'OUTROS');

-- CreateEnum
CREATE TYPE "EstadoConservacao" AS ENUM ('Novo', 'Bom', 'Regular', 'Danificado', 'Inservivel');

-- CreateEnum
CREATE TYPE "OrigemPatrimonio" AS ENUM ('Compra', 'Doacao', 'Transferencia', 'Outro');

-- CreateEnum
CREATE TYPE "TipoMovimentacao" AS ENUM ('Transferencia', 'Baixa', 'Reparo', 'Auditoria', 'Outro');

-- CreateEnum
CREATE TYPE "MetodoDepreciacao" AS ENUM ('Linear');

-- CreateEnum
CREATE TYPE "AuditStatus" AS ENUM ('SUCCESS', 'FAILED', 'UNAUTHORIZED');

-- CreateTable
CREATE TABLE "usuarios" (
    "idUsuario" UUID NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "email" VARCHAR(120) NOT NULL,
    "senha" VARCHAR(255) NOT NULL,
    "perfil" "Perfil" NOT NULL DEFAULT 'MEMBRO',
    "status" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "reset_token" VARCHAR(255),
    "reset_token_expiry" TIMESTAMP(3),
    "ultimo_login" TIMESTAMP(3),
    "two_factor_secret" VARCHAR(255),
    "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
    "two_factor_backup_codes" TEXT,
    "session_id" VARCHAR(255),
    "browser_fingerprint" VARCHAR(255),

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("idUsuario")
);

-- CreateTable
CREATE TABLE "membros" (
    "idMembro" UUID NOT NULL,
    "idUsuario" UUID,
    "nome_completo" VARCHAR(150) NOT NULL,
    "data_nascimento" DATE,
    "genero" "Genero",
    "estado_civil" VARCHAR(50),
    "telefone" VARCHAR(50),
    "email" VARCHAR(120),
    "endereco" TEXT,
    "data_batismo" DATE,
    "data_conversao" DATE,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "foto_perfil" VARCHAR(255),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "membros_pkey" PRIMARY KEY ("idMembro")
);

-- CreateTable
CREATE TABLE "dizimos" (
    "idDizimo" UUID NOT NULL,
    "id_membro" UUID NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "data" DATE NOT NULL,
    "metodo_pagamento" "MetodoPagamento" NOT NULL,
    "observacao" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dizimos_pkey" PRIMARY KEY ("idDizimo")
);

-- CreateTable
CREATE TABLE "ofertas" (
    "idOferta" UUID NOT NULL,
    "id_membro" UUID,
    "valor" DECIMAL(10,2) NOT NULL,
    "tipo" "TipoOferta" NOT NULL,
    "data" DATE NOT NULL,
    "observacao" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ofertas_pkey" PRIMARY KEY ("idOferta")
);

-- CreateTable
CREATE TABLE "ministerios" (
    "idMinisterio" UUID NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "descricao" TEXT,
    "lider" UUID,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ministerios_pkey" PRIMARY KEY ("idMinisterio")
);

-- CreateTable
CREATE TABLE "eventos" (
    "idEvento" UUID NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "data_inicio" DATE NOT NULL,
    "data_fim" DATE,
    "local" VARCHAR(150),
    "descricao" TEXT,
    "responsavel" UUID,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "eventos_pkey" PRIMARY KEY ("idEvento")
);

-- CreateTable
CREATE TABLE "presencas_eventos" (
    "idPresenca" UUID NOT NULL,
    "id_evento" UUID NOT NULL,
    "id_membro" UUID NOT NULL,
    "presente" BOOLEAN NOT NULL DEFAULT false,
    "data_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "presencas_eventos_pkey" PRIMARY KEY ("idPresenca")
);

-- CreateTable
CREATE TABLE "visitantes" (
    "idVisitante" UUID NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "telefone" VARCHAR(50),
    "email" VARCHAR(120),
    "data_visita" DATE NOT NULL,
    "observacao" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visitantes_pkey" PRIMARY KEY ("idVisitante")
);

-- CreateTable
CREATE TABLE "membro_ministerio" (
    "id_membro" UUID NOT NULL,
    "id_ministerio" UUID NOT NULL,
    "data_entrada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "membro_ministerio_pkey" PRIMARY KEY ("id_membro","id_ministerio")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "idLog" UUID NOT NULL,
    "usuarioId" UUID NOT NULL,
    "acao" VARCHAR(100) NOT NULL,
    "entidade" VARCHAR(50) NOT NULL,
    "entidadeId" TEXT,
    "dadosAnteriores" JSONB,
    "dadosNovos" JSONB,
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "AuditStatus" NOT NULL DEFAULT 'SUCCESS',

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("idLog")
);

-- CreateTable
CREATE TABLE "patrimonio_categorias" (
    "idCategoria" UUID NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patrimonio_categorias_pkey" PRIMARY KEY ("idCategoria")
);

-- CreateTable
CREATE TABLE "patrimonio" (
    "idPatrimonio" UUID NOT NULL,
    "idCategoria" UUID NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "descricao" TEXT,
    "codigo_inventario" VARCHAR(50) NOT NULL,
    "valor_aquisicao" DECIMAL(14,2) NOT NULL,
    "data_aquisicao" DATE NOT NULL,
    "vida_util_anos" INTEGER NOT NULL DEFAULT 5,
    "valor_residual" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "estado_conservacao" "EstadoConservacao" NOT NULL DEFAULT 'Bom',
    "localizacao" VARCHAR(120) NOT NULL,
    "idResponsavel" UUID,
    "origem" "OrigemPatrimonio" NOT NULL DEFAULT 'Compra',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patrimonio_pkey" PRIMARY KEY ("idPatrimonio")
);

-- CreateTable
CREATE TABLE "patrimonio_movimentacoes" (
    "idMovimentacao" UUID NOT NULL,
    "idPatrimonio" UUID NOT NULL,
    "tipo_movimentacao" "TipoMovimentacao" NOT NULL,
    "descricao" TEXT NOT NULL,
    "local_anterior" VARCHAR(120),
    "novo_local" VARCHAR(120),
    "id_responsavel_anterior" UUID,
    "id_responsavel_novo" UUID,
    "data_movimentacao" DATE NOT NULL,
    "registrado_por" UUID NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patrimonio_movimentacoes_pkey" PRIMARY KEY ("idMovimentacao")
);

-- CreateTable
CREATE TABLE "patrimonio_depreciacao" (
    "idDepreciacao" UUID NOT NULL,
    "idPatrimonio" UUID NOT NULL,
    "data_calculo" DATE NOT NULL,
    "valor_depreciado" DECIMAL(14,2) NOT NULL,
    "valor_atual" DECIMAL(14,2) NOT NULL,
    "metodo" "MetodoDepreciacao" NOT NULL DEFAULT 'Linear',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patrimonio_depreciacao_pkey" PRIMARY KEY ("idDepreciacao")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "token" VARCHAR(500) NOT NULL,
    "user_id" UUID NOT NULL,
    "expires_at" TIMESTAMP NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "membros_idUsuario_key" ON "membros"("idUsuario");

-- CreateIndex
CREATE UNIQUE INDEX "presencas_eventos_id_evento_id_membro_key" ON "presencas_eventos"("id_evento", "id_membro");

-- CreateIndex
CREATE INDEX "audit_logs_usuarioId_idx" ON "audit_logs"("usuarioId");

-- CreateIndex
CREATE INDEX "audit_logs_entidade_idx" ON "audit_logs"("entidade");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_acao_idx" ON "audit_logs"("acao");

-- CreateIndex
CREATE UNIQUE INDEX "patrimonio_categorias_nome_key" ON "patrimonio_categorias"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "patrimonio_codigo_inventario_key" ON "patrimonio"("codigo_inventario");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");

-- AddForeignKey
ALTER TABLE "membros" ADD CONSTRAINT "membros_idUsuario_fkey" FOREIGN KEY ("idUsuario") REFERENCES "usuarios"("idUsuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dizimos" ADD CONSTRAINT "dizimos_id_membro_fkey" FOREIGN KEY ("id_membro") REFERENCES "membros"("idMembro") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ofertas" ADD CONSTRAINT "ofertas_id_membro_fkey" FOREIGN KEY ("id_membro") REFERENCES "membros"("idMembro") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ministerios" ADD CONSTRAINT "ministerios_lider_fkey" FOREIGN KEY ("lider") REFERENCES "membros"("idMembro") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_responsavel_fkey" FOREIGN KEY ("responsavel") REFERENCES "membros"("idMembro") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presencas_eventos" ADD CONSTRAINT "presencas_eventos_id_evento_fkey" FOREIGN KEY ("id_evento") REFERENCES "eventos"("idEvento") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presencas_eventos" ADD CONSTRAINT "presencas_eventos_id_membro_fkey" FOREIGN KEY ("id_membro") REFERENCES "membros"("idMembro") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membro_ministerio" ADD CONSTRAINT "membro_ministerio_id_membro_fkey" FOREIGN KEY ("id_membro") REFERENCES "membros"("idMembro") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membro_ministerio" ADD CONSTRAINT "membro_ministerio_id_ministerio_fkey" FOREIGN KEY ("id_ministerio") REFERENCES "ministerios"("idMinisterio") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("idUsuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patrimonio" ADD CONSTRAINT "patrimonio_idCategoria_fkey" FOREIGN KEY ("idCategoria") REFERENCES "patrimonio_categorias"("idCategoria") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patrimonio" ADD CONSTRAINT "patrimonio_idResponsavel_fkey" FOREIGN KEY ("idResponsavel") REFERENCES "membros"("idMembro") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patrimonio_movimentacoes" ADD CONSTRAINT "patrimonio_movimentacoes_idPatrimonio_fkey" FOREIGN KEY ("idPatrimonio") REFERENCES "patrimonio"("idPatrimonio") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patrimonio_movimentacoes" ADD CONSTRAINT "patrimonio_movimentacoes_id_responsavel_anterior_fkey" FOREIGN KEY ("id_responsavel_anterior") REFERENCES "membros"("idMembro") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patrimonio_movimentacoes" ADD CONSTRAINT "patrimonio_movimentacoes_id_responsavel_novo_fkey" FOREIGN KEY ("id_responsavel_novo") REFERENCES "membros"("idMembro") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patrimonio_movimentacoes" ADD CONSTRAINT "patrimonio_movimentacoes_registrado_por_fkey" FOREIGN KEY ("registrado_por") REFERENCES "usuarios"("idUsuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patrimonio_depreciacao" ADD CONSTRAINT "patrimonio_depreciacao_idPatrimonio_fkey" FOREIGN KEY ("idPatrimonio") REFERENCES "patrimonio"("idPatrimonio") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "usuarios"("idUsuario") ON DELETE CASCADE ON UPDATE CASCADE;
