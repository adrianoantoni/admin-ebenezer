import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    try {
        const anos = await prisma.anoFiscal.findMany();
        console.log('Anos Fiscais no DB:', JSON.stringify(anos, null, 2));

        const active = await prisma.anoFiscal.findFirst({ where: { ativo: true } });
        console.log('Ano Ativo:', JSON.stringify(active, null, 2));

        const dizimos = await prisma.dizimo.findMany({
            take: 5,
            select: { idDizimo: true, idAnoFiscal: true }
        });
        console.log('Sample dízimos:', JSON.stringify(dizimos, null, 2));

    } catch (err) {
        console.error('Erro ao verificar:', err);
    } finally {
        await prisma.$disconnect();
    }
}

check();
