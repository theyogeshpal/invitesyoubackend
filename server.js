import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import apiRoutes, { seedInitialData } from './routes/api.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Also load frontend .env if present
dotenv.config({ path: path.resolve(__dirname, '..', 'frontend', '.env') });

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/invites you';

// Middleware
app.use(cors());
app.use(express.json());

// Dynamic frontend env config
const frontendPath = path.resolve(__dirname, '..', 'frontend');

app.get(['/api/config', '/assets/js/env.js', '/frontend/assets/js/env.js'], (req, res) => {
    const envConfig = {
        API_URL: process.env.VITE_API_URL || process.env.API_URL || 'http://localhost:5000/api',
        WHATSAPP_NUMBER: process.env.VITE_WHATSAPP_NUMBER || process.env.WHATSAPP_NUMBER || '917817095043',
        WHATSAPP_DISPLAY: process.env.VITE_WHATSAPP_DISPLAY || process.env.WHATSAPP_DISPLAY || '+91 7817095043',
        SITE_URL: process.env.VITE_SITE_URL || process.env.SITE_URL || 'https://invitesyou.in',
        IMAGEKIT_URL: process.env.VITE_IMAGEKIT_URL || process.env.IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/typ1309'
    };

    if (req.path.endsWith('env.js')) {
        res.setHeader('Content-Type', 'application/javascript');
        try {
            const rawJs = fs.readFileSync(path.resolve(frontendPath, 'assets', 'js', 'env.js'), 'utf8');
            return res.send(`window.__ENV__ = ${JSON.stringify(envConfig)};\n` + rawJs);
        } catch {
            return res.send(`window.__ENV__ = ${JSON.stringify(envConfig)};`);
        }
    }
    res.json(envConfig);
});

// Serve frontend static files
app.use('/frontend', express.static(frontendPath));
app.use(express.static(frontendPath));

// Routes
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'Invites You Digital Invitation Cards API is running...', status: 'OK' });
});

// Connect to MongoDB and start server
mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('✅ MongoDB connected');
        try {
            await seedInitialData();
        } catch (sErr) {
            console.error('Seed check warning:', sErr.message);
        }
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('❌ MongoDB connection failed:', err.message);
        console.log('⚠️  Starting server without DB (mock mode)...');
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT} (No DB)`);
        });
    });
