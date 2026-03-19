import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function countGranular() {
    const tables = [
        'usuario', 'membro', 'dizimo', 'oferta', 'saida', 
        'casamento', 'escolaTurma', 'livro', 'patrimonio'
    ];

    console.log('--- GRANULAR RECORD COUNT ---');

    for (const table of tables) {
        try {
            const count = await (prisma as any)[table].count();
            console.log(`${table}: ${count}`);
        } catch (error: any) {
            console.log(`${table}: ERROR - ${error.message.substring(0, 100)}`);
        }
    }

    await prisma.$disconnect();
}

countGranular();
