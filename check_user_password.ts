
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkPassword() {
    const email = 'adriano@test.com';
    const password = 'admin123';

    try {
        const user = await (prisma as any).usuario.findUnique({
            where: { email },
        });

        if (!user) {
            console.log('User not found');
            return;
        }

        const isValid = await bcrypt.compare(password, user.senha);
        console.log(`Password 'admin123' is valid for ${email}: ${isValid}`);

        if (!isValid) {
            const newHash = await bcrypt.hash(password, 10);
            console.log(`New hash for 'admin123': ${newHash}`);
            // Descomente abaixo se quiser atualizar
            // await (prisma as any).usuario.update({ where: { email }, data: { senha: newHash } });
            // console.log('Password updated successfully');
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkPassword();
