import './loadEnv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth';
import membersRoutes from './routes/members';
import financeRoutes from './routes/finance';
import inventoryRoutes from './routes/inventory';
import eventRoutes from './routes/events';
import departmentRoutes from './routes/departments';
import marriageRoutes from './routes/marriages';
import schoolRoutes from './routes/school';
import libraryRoutes from './routes/library';
import settingsRoutes from './routes/settings';
import socialRoutes from './routes/social';
import usersRoutes from './routes/users';
import fiscalYearRoutes from './routes/fiscal-year';
import auditRoutes from './routes/audit';
import { authenticateToken } from './middleware/auth';
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

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/members', membersRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/marriages', marriageRoutes);
app.use('/api/school', schoolRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/fiscal-years', fiscalYearRoutes);
app.use('/api/audit', auditRoutes);

// Protected Sample Route
app.get('/api/auth/me', authenticateToken, (req, res) => {
    res.json({ message: 'Acesso concedido', user: (req as any).user });
});

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

// Test Proxy Route
app.get('/api/test-proxy', (req, res) => {
    console.log('✅ Pedido de teste recebido no backend');
    res.json({ message: 'Proxy funcionando corretamente!', timestamp: new Date().toISOString() });
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
