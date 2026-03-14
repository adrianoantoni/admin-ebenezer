// import './loadEnv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/error';

const app = express();
const PORT = process.env.PORT || 3001;

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

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Diagnostic Route
app.get('/api/diag', async (req, res) => {
    const diag: any = {
        timestamp: new Date().toISOString(),
        info: 'Testing middleware without loadEnv',
        env: {
            NODE_ENV: process.env.NODE_ENV,
            DATABASE_URL_SET: !!process.env.DATABASE_URL,
            JWT_SECRET_SET: !!process.env.JWT_SECRET,
            TZ: process.env.TZ
        },
        db: 'PENDING'
    };

    try {
        const prismaImport = await import('./db');
        const prismaClient = prismaImport.default;
        await (prismaClient as any).$queryRaw`SELECT 1`;
        diag.db = 'CONNECTED';
    } catch (error: any) {
        diag.db = 'FAILED';
        diag.error = error.message;
    }

    res.json(diag);
});

// Centralized Error Handling
app.use(errorHandler);

// Initializing server only if NOT running as Vercel serverless function
if (process.env.NODE_ENV !== 'production') {
    app.listen(Number(PORT), '127.0.0.1', () => {
        console.log(`Server running on http://127.0.0.1:${PORT}`);
    });
}

export default app;
