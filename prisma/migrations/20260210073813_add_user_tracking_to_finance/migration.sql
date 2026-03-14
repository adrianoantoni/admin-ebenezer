/*
  Warnings:

  - You are about to alter the column `bi` on the `membros` table. The data in that column could be lost. The data in that column will be cast from `VarChar(50)` to `VarChar(30)`.

*/
-- AlterTable
ALTER TABLE "dizimos" ADD COLUMN     "data_referencia" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "id_usuario" UUID;

-- AlterTable
ALTER TABLE "membros" ADD COLUMN     "orfao_de_mae" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "orfao_de_pai" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "valor_dizimo_esperado" DECIMAL(10,2) NOT NULL DEFAULT 0,
ALTER COLUMN "bi" SET DATA TYPE VARCHAR(30);

-- AlterTable
ALTER TABLE "ofertas" ADD COLUMN     "id_usuario" UUID;

-- AddForeignKey
ALTER TABLE "dizimos" ADD CONSTRAINT "dizimos_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("idUsuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ofertas" ADD CONSTRAINT "ofertas_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("idUsuario") ON DELETE SET NULL ON UPDATE CASCADE;
