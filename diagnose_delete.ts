import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function diagnose() {
    console.log('--- DIAGNÓSTICO DE ANULAÇÃO ---');

    // Buscar o último dízimo pago
    const lastTithe = await (prisma as any).dizimo.findFirst({
        where: { status: 'PAGO' },
        orderBy: { dataReferencia: 'desc' },
        include: { membro: true }
    });

    if (!lastTithe) {
        console.log('Nenhum dízimo PAGO encontrado para testar.');
        return;
    }

    console.log(`Testando dízimo de ${lastTithe.membro.nomeCompleto} - Ref: ${lastTithe.dataReferencia.toISOString()}`);

    // Simular a lógica do backend
    const laterTithe = await (prisma as any).dizimo.findFirst({
        where: {
            idMembro: lastTithe.idMembro,
            dataReferencia: { gt: lastTithe.dataReferencia },
            status: 'PAGO'
        }
    });

    if (laterTithe) {
        console.log('❌ FALHA ESPERADA: Existe um dízimo PAGO posterior.');
        console.log(`Posterior: ${laterTithe.dataReferencia.toISOString()}`);
    } else {
        console.log('✅ SUCESSO ESPERADO: Não existe dízimo PAGO posterior.');

        // Tentar deletar (usando transação para não quebrar o banco permanentemente no teste)
        try {
            console.log('Tentando deletar o registro...');
            // Na verdade, vamos apenas verificar se o ID existe
            const exists = await (prisma as any).dizimo.findUnique({
                where: { idDizimo: lastTithe.idDizimo }
            });
            console.log(`Registro existe antes: ${!!exists}`);
        } catch (e) {
            console.error('Erro na deleção simulada:', e);
        }
    }
}

diagnose()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
