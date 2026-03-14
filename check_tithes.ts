
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const members = await prisma.membro.findMany({
        orderBy: { nomeCompleto: 'asc' }
    });

    console.log(`Total members: ${members.length}`);
    members.forEach(m => {
        console.log(`- "${m.nomeCompleto}" ID: ${m.idMembro}`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
