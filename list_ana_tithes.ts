import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listTithes() {
    const memberName = 'Ana Oliveira';
    const member = await (prisma as any).membro.findFirst({
        where: { nomeCompleto: memberName }
    });

    if (!member) {
        console.log(`Membro ${memberName} não encontrado.`);
        return;
    }

    const tithes = await (prisma as any).dizimo.findMany({
        where: { idMembro: member.idMembro },
        orderBy: { dataReferencia: 'asc' }
    });

    console.log(`Dízimos para ${memberName}:`);
    tithes.forEach((t: any) => {
        console.log(`- ID: ${t.idDizimo}, Ref: ${t.dataReferencia.toISOString()}, Status: ${t.status}, Valor: ${t.valor}`);
    });
}

listTithes()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
