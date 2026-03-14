import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'adriano@test.com';
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.usuario.upsert({
        where: { email },
        update: {
            senha: hashedPassword,
            perfil: 'ADMIN',
            ativo: true
        },
        create: {
            nome: 'Adriano Admin',
            email,
            senha: hashedPassword,
            perfil: 'ADMIN',
            ativo: true
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
