-- CreateEnum
CREATE TYPE "StatusCasamento" AS ENUM ('EM_PROCESSO', 'REALIZADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "StatusDocumento" AS ENUM ('PENDENTE', 'COMPLETO');

-- CreateEnum
CREATE TYPE "StatusEmprestimo" AS ENUM ('ATIVO', 'DEVOLVIDO', 'ATRASADO');

-- CreateTable
CREATE TABLE "casamentos" (
    "idCasamento" UUID NOT NULL,
    "nome_noivo" VARCHAR(150) NOT NULL,
    "noivo_membro" BOOLEAN NOT NULL DEFAULT true,
    "nome_noiva" VARCHAR(150) NOT NULL,
    "noiva_membro" BOOLEAN NOT NULL DEFAULT true,
    "data" DATE NOT NULL,
    "hora" VARCHAR(10),
    "local" VARCHAR(200),
    "celebrante" VARCHAR(150),
    "status" "StatusCasamento" NOT NULL DEFAULT 'EM_PROCESSO',
    "testemunhas" TEXT,
    "status_documento" "StatusDocumento" NOT NULL DEFAULT 'PENDENTE',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "casamentos_pkey" PRIMARY KEY ("idCasamento")
);

-- CreateTable
CREATE TABLE "escola_turmas" (
    "idTurma" UUID NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "professor" VARCHAR(150),
    "faixa_etaria" VARCHAR(50),
    "sala" VARCHAR(50),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "escola_turmas_pkey" PRIMARY KEY ("idTurma")
);

-- CreateTable
CREATE TABLE "escola_presencas" (
    "idPresenca" UUID NOT NULL,
    "id_turma" UUID NOT NULL,
    "data" DATE NOT NULL,
    "estudantes_presentes" JSONB NOT NULL,

    CONSTRAINT "escola_presencas_pkey" PRIMARY KEY ("idPresenca")
);

-- CreateTable
CREATE TABLE "livros" (
    "idLivro" UUID NOT NULL,
    "titulo" VARCHAR(200) NOT NULL,
    "autor" VARCHAR(150) NOT NULL,
    "categoria" VARCHAR(100),
    "quantidade_total" INTEGER NOT NULL DEFAULT 1,
    "quantidade_disponivel" INTEGER NOT NULL DEFAULT 1,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "livros_pkey" PRIMARY KEY ("idLivro")
);

-- CreateTable
CREATE TABLE "livro_emprestimos" (
    "idEmprestimo" UUID NOT NULL,
    "id_livro" UUID NOT NULL,
    "id_membro" UUID NOT NULL,
    "data_emprestimo" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_devolucao" TIMESTAMP(3),
    "status" "StatusEmprestimo" NOT NULL DEFAULT 'ATIVO',

    CONSTRAINT "livro_emprestimos_pkey" PRIMARY KEY ("idEmprestimo")
);

-- CreateTable
CREATE TABLE "igreja_configuracoes" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "nome_igreja" VARCHAR(200) NOT NULL,
    "cnpj" VARCHAR(20),
    "denominacao" VARCHAR(150),
    "telefone" VARCHAR(50),
    "email" VARCHAR(120),
    "endereco_json" JSONB,
    "redes_sociais" JSONB,
    "logo" TEXT,
    "missao" TEXT,
    "visao" TEXT,
    "valores" TEXT,

    CONSTRAINT "igreja_configuracoes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "escola_presencas" ADD CONSTRAINT "escola_presencas_id_turma_fkey" FOREIGN KEY ("id_turma") REFERENCES "escola_turmas"("idTurma") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "livro_emprestimos" ADD CONSTRAINT "livro_emprestimos_id_livro_fkey" FOREIGN KEY ("id_livro") REFERENCES "livros"("idLivro") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "livro_emprestimos" ADD CONSTRAINT "livro_emprestimos_id_membro_fkey" FOREIGN KEY ("id_membro") REFERENCES "membros"("idMembro") ON DELETE RESTRICT ON UPDATE CASCADE;
