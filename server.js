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
        logger.error('UPLOAD', 'Upload processing failed', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        console.error('Upload error details:', error);
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

        // Create an AbortController for this request
        const controller = new AbortController();

        // Listen for client disconnect
        res.on('close', () => {
            logger.info('ASK', 'Client disconnected, cancelling request');
            controller.abort();
        });

        // Pass the signal to the service
        // Expect a stream result now
        const { stream, sourceDocuments } = await ragService.askQuestion(question, controller.signal);

        // Set headers for streaming
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Transfer-Encoding', 'chunked');

        // Send sources first as a JSON line
        res.write(JSON.stringify({ type: 'sources', data: sourceDocuments }) + '\n');

        // Iterate over the stream
        for await (const chunk of stream) {
            // Check for client disconnect to break loop
            if (controller.signal.aborted) break;

            // LangChain chunk is usually a string or object depending on model
            // For Ollama it's usually just content string
            const content = typeof chunk === 'string' ? chunk : chunk.content;

            if (content) {
                res.write(JSON.stringify({ type: 'token', content: content }) + '\n');
            }
        }

        // Send done signal
        res.write(JSON.stringify({ type: 'done' }) + '\n');
        res.end();

        logger.info('ASK', 'Streaming completed');

    } catch (error) {
        if (error.message === 'Request cancelled by user') {
            logger.info('ASK', 'Request was cancelled by the client');
            return;
        }
        logger.error('ASK', 'Question processing failed', error);
        if (!res.headersSent) {
            res.status(500).json({
                error: 'Failed to process question',
                message: error.message
            });
        }
    }
});

app.get('/api/logs', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const onLog = (log) => {
        res.write(`data: ${JSON.stringify(log)}\n\n`);
    };

    logger.on('log', onLog);

    req.on('close', () => {
        logger.off('log', onLog);
    });

});

app.get('/api/status', (req, res) => {
    try {

        const count = ragService.getDocumentCount();
        const metadata = ragService.getMetadata();

        res.json({
            ready: count > 0,
            documentCount: count,
            metadata: metadata
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


app.listen(PORT, () => {
    logger.info('SERVER', `Server running on http://localhost:${PORT}`);
    console.log(`Server running on http://localhost:${PORT}`);
});
