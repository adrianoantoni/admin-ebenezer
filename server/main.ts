import './loadEnv.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth.js';
import { errorHandler } from './middleware/error.js';

const app = express();

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "blob:"],
            connectSrc: ["'self'", "https://*.vercel.app", "https://generativelanguage.googleapis.com"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'self'"],
        },
    },
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Diagnostic Route
app.get('/api/diag', async (req, res) => {
    const diag: any = {
        timestamp: new Date().toISOString(),
        env: {
            NODE_ENV: process.env.NODE_ENV,
            DATABASE_URL_SET: !!process.env.DATABASE_URL,
            JWT_SECRET_SET: !!process.env.JWT_SECRET,
        },
        db: 'PENDING'
    };

    try {
        const prismaImport = await import('./db.js');
        const prismaClient = prismaImport.default;
        await (prismaClient as any).$queryRaw`SELECT 1`;
        diag.db = 'CONNECTED';
    } catch (error: any) {
        diag.db = 'FAILED';
        diag.error = error.message;
    }

    res.json(diag);
});

app.use(errorHandler);

export default app;
