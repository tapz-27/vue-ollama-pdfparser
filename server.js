import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import ragService from './services/ragService.js';
import logger from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

app.post('/api/upload', upload.single('pdf'), async (req, res) => {
    const operationId = `upload_${Date.now()}`;
    logger.startTimer(operationId);

    try {
        if (!req.file) {
            logger.warn('UPLOAD', 'No file provided in request');
            return res.status(400).json({ error: 'No file uploaded' });
        }

        logger.info('UPLOAD', 'File upload started', {
            filename: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype
        });

        const result = await ragService.processPDF(req.file.path);

        const duration = logger.endTimer(operationId);
        logger.info('UPLOAD', 'Upload and processing completed', {
            filename: req.file.originalname,
            totalDuration: duration
        });

        res.json({
            success: true,
            filename: req.file.originalname,
            ...result
        });
    } catch (error) {
        logger.error('UPLOAD', 'Upload processing failed', error);
        res.status(500).json({
            error: 'Failed to process PDF',
            message: error.message
        });
    }
});

app.post('/api/ask', async (req, res) => {
    try {
        const { question } = req.body;

        if (!question) {
            logger.warn('ASK', 'No question provided in request');
            return res.status(400).json({ error: 'No question provided' });
        }

        logger.info('ASK', 'Question received', { question });

        const result = await ragService.askQuestion(question);

        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        logger.error('ASK', 'Question processing failed', error);
        res.status(500).json({
            error: 'Failed to process question',
            message: error.message
        });
    }
});

app.listen(PORT, () => {
    logger.info('SERVER', `Server running on http://localhost:${PORT}`);
    console.log(`Server running on http://localhost:${PORT}`);
});
