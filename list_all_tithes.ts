
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const tithes = await prisma.dizimo.findMany({
        orderBy: { dataReferencia: 'asc' }
    });

    console.log(`Total Tithes in DB: ${tithes.length}`);
    for (const t of tithes) {
        console.log(`Ref: ${t.dataReferencia.toISOString()} | MembroId: ${t.idMembro} | ID: ${t.idDizimo}`);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
