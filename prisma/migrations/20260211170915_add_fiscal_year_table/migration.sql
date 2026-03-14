-- AlterTable
ALTER TABLE "dizimos" ADD COLUMN     "id_ano_fiscal" UUID,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PAGO';

-- CreateTable
CREATE TABLE "anos_fiscais" (
    "idAno" UUID NOT NULL,
    "ano" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT false,
    "descricao" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anos_fiscais_pkey" PRIMARY KEY ("idAno")
);

-- CreateIndex
CREATE UNIQUE INDEX "anos_fiscais_ano_key" ON "anos_fiscais"("ano");

-- AddForeignKey
ALTER TABLE "dizimos" ADD CONSTRAINT "dizimos_id_ano_fiscal_fkey" FOREIGN KEY ("id_ano_fiscal") REFERENCES "anos_fiscais"("idAno") ON DELETE SET NULL ON UPDATE CASCADE;
