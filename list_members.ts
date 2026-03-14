import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listMembers() {
    try {
        const members = await (prisma as any).membro.findMany();
        console.log('All Members:', JSON.stringify(members, null, 2));
    } catch (error) {
        console.error('Error listing members:', error);
    } finally {
        await prisma.$disconnect();
    }
}

listMembers();
