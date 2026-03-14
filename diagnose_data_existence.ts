import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const counts = {
            usuarios: await prisma.usuario.count(),
            membros: await prisma.membro.count(),
            anosFiscais: await prisma.anoFiscal.count(),
            dizimos: await prisma.dizimo.count(),
            ofertas: await prisma.oferta.count(),
            saidas: await prisma.saida.count(),
            ministerios: await prisma.ministerio.count(),
            eventos: await prisma.evento.count(),
        };

        console.log('Database Record Counts:', JSON.stringify(counts, null, 2));

        if (counts.anosFiscais > 0) {
            const activeYear = await prisma.anoFiscal.findFirst({ where: { ativo: true } });
            console.log('Active Fiscal Year:', activeYear);
        } else {
            console.log('No fiscal years found!');
        }

    } catch (error) {
        console.error('Error counting records:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
