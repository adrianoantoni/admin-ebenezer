import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listUsers() {
    try {
        const users = await (prisma as any).usuario.findMany({
            select: {
                idUsuario: true,
                nome: true,
                email: true,
                perfil: true,
            }
        });
        console.log('Existing Users:', JSON.stringify(users, null, 2));
    } catch (error) {
        console.error('Error listing users:', error);
    } finally {
        await prisma.$disconnect();
    }
}

listUsers();
