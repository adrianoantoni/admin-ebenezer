import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const classes = await prisma.escolaTurma.findMany();
    console.log('--- ENROLLMENTS ---');
    for (const c of classes) {
        if (Array.isArray(c.estudantesIds) && c.estudantesIds.length > 0) {
            console.log(`Class: ${c.nome} (${c.idTurma})`);
            console.log(`Students: ${c.estudantesIds}`);
            // Just take the first one
            const firstStudent = c.estudantesIds[0];
            console.log(`TEST TARGET -> Class: ${c.idTurma}, Member: ${firstStudent}`);
            break;
        }
    }
    console.log('-------------------');
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
