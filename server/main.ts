import './loadEnv.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth.js';
import membersRoutes from './routes/members.js';
import financeRoutes from './routes/finance.js';
import fiscalYearRoutes from './routes/fiscal-year.js';
import eventsRoutes from './routes/events.js';
import socialRoutes from './routes/social.js';
import inventoryRoutes from './routes/inventory.js';
import libraryRoutes from './routes/library.js';
import marriagesRoutes from './routes/marriages.js';
import departmentsRoutes from './routes/departments.js';
import settingsRoutes from './routes/settings.js';
import schoolRoutes from './routes/school.js';
import usersRoutes from './routes/users.js';
import auditRoutes from './routes/audit.js';
import { errorHandler } from './middleware/error.js';

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
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
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

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/members', membersRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/fiscal-years', fiscalYearRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/marriages', marriagesRoutes);
app.use('/api/departments', departmentsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/school', schoolRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/audit', auditRoutes);

// Centralized Error Handling
app.use(errorHandler);

// Initializing server only if NOT running as Vercel serverless function
if (process.env.NODE_ENV !== 'production') {
    app.listen(Number(PORT), '127.0.0.1', () => {
        console.log(`Server running on http://127.0.0.1:${PORT}`);
    });
}

export default app;
