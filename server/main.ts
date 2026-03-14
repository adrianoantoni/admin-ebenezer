// import './loadEnv';
import express from 'express';

const app = express();

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Diagnostic Route
app.get('/api/diag', async (req, res) => {
    res.json({
        message: 'No middleware main.ts test',
        env: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
    });
});

export default app;
