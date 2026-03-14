import './loadEnv.ts';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth.ts';
import membersRoutes from './routes/members.ts';
import financeRoutes from './routes/finance.ts';
import inventoryRoutes from './routes/inventory.ts';
import eventRoutes from './routes/events.ts';
import departmentRoutes from './routes/departments.ts';
import marriageRoutes from './routes/marriages.ts';
import schoolRoutes from './routes/school.ts';
import libraryRoutes from './routes/library.ts';
import settingsRoutes from './routes/settings.ts';
import socialRoutes from './routes/social.ts';
import usersRoutes from './routes/users.ts';
import fiscalYearRoutes from './routes/fiscal-year.ts';
import auditRoutes from './routes/audit.ts';
import { authenticateToken } from './middleware/auth.ts';
import { errorHandler } from './middleware/error.ts';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "blob:"],
            connectSrc: ["'self'", "http://127.0.0.1:3001", "https://generativelanguage.googleapis.com"],
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

// Test Proxy Route
app.get('/api/test-proxy', (req, res) => {
    console.log('✅ Pedido de teste recebido no backend');
    res.json({ message: 'Proxy funcionando corretamente!', timestamp: new Date().toISOString() });
});

// Centralized Error Handling
app.use(errorHandler);

app.listen(Number(PORT), '127.0.0.1', () => {
    console.log(`Server running on http://127.0.0.1:${PORT}`);
});
