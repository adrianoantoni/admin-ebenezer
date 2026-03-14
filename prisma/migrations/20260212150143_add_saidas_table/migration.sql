-- CreateTable
CREATE TABLE "saidas" (
    "idSaida" UUID NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "categoria" VARCHAR(100) NOT NULL,
    "data" DATE NOT NULL,
    "metodo_pagamento" "MetodoPagamento" NOT NULL,
    "observacao" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "id_usuario" UUID,
    "id_ano_fiscal" UUID,

    CONSTRAINT "saidas_pkey" PRIMARY KEY ("idSaida")
);

-- AddForeignKey
ALTER TABLE "saidas" ADD CONSTRAINT "saidas_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("idUsuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saidas" ADD CONSTRAINT "saidas_id_ano_fiscal_fkey" FOREIGN KEY ("id_ano_fiscal") REFERENCES "anos_fiscais"("idAno") ON DELETE SET NULL ON UPDATE CASCADE;
