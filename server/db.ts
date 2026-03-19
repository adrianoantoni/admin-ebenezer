import { PrismaClient } from '@prisma/client';

console.log('🔌 DB.TS: DATABASE_URL forcing:', process.env.DATABASE_URL);

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
    log: ['error', 'warn'],
});

export default prisma;
