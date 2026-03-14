import express from 'express';

const app = express();

app.get('/api/diag', (req, res) => {
    res.json({
        message: 'Barebones index.ts working!',
        env: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
    });
});

export default app;
