import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function debugLogin() {
    const email = 'admin@test.com';
    const password = 'admin123';

    try {
        console.log(`Checking user: ${email}`);
        const user = await (prisma as any).usuario.findUnique({
            where: { email },
        });

        if (!user) {
            console.log('User not found!');
            return;
        }

        console.log('User found:', {
            idUsuario: user.idUsuario,
            nome: user.nome,
            email: user.email,
            perfil: user.perfil,
            senhaHash: user.senha.substring(0, 10) + '...'
        });

        const isPasswordValid = await bcrypt.compare(password, user.senha);
        console.log(`Password valid: ${isPasswordValid}`);

    } catch (error) {
        console.error('Database error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

debugLogin();
