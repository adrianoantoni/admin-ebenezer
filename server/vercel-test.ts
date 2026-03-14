import express from 'express';
const app = express();

app.get('/api/vercel-test', async (req, res) => {
    let prismaStatus = 'NOT CHECKED';
    try {
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        prismaStatus = 'LOADED';
    } catch (e: any) {
        prismaStatus = 'ERROR: ' + e.message;
    }

    res.json({
        message: 'Minimal Vercel entry point working!',
        env: process.env.NODE_ENV,
        cwd: process.cwd(),
        prisma: prismaStatus,
        timestamp: new Date().toISOString()
    });
});

export default app;
