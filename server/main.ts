// import './loadEnv';
import express from 'express';

const app = express();

app.get('/api/diag', (req, res) => {
    res.json({
        message: 'LoadEnv test working!',
        env: process.env.NODE_ENV,
        tz: process.env.TZ,
        timestamp: new Date().toISOString()
    });
});

export default app;
