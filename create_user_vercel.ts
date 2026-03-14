import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'adrianonzuzinzuzi@gmail.com';
    const password = 'Ac3ss0r3str1t0!';
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await (prisma as any).usuario.upsert({
        where: { email },
        update: {
            senha: hashedPassword,
            perfil: 'ADMIN',
            status: true
        },
        create: {
            nome: 'Adriano Nzuzi',
            email,
            senha: hashedPassword,
            perfil: 'ADMIN',
            status: true
        }
    });

    console.log('--- USER CREATED/UPDATED ---');
    console.log(`User: ${user.nome} (${user.email})`);
    console.log(`ID: ${user.idUsuario}`);
    console.log('----------------------------');
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
