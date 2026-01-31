import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { OllamaEmbeddings } from '@langchain/ollama';
import { Ollama } from '@langchain/ollama';
import { Document } from '@langchain/core/documents';
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import logger from '../utils/logger.js';
import vectorStoreManager from './VectorStoreManager.js';
import { QA_PROMPT_TEMPLATE, QUIZ_PROMPT_TEMPLATE } from '../utils/prompts.js';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

class RAGService {
    constructor() {
        this.llm = null;
        this.embeddings = null;
        this.initializeModels();
    }

    async initializeModels() {
        try {
            logger.info('RAG_INIT', 'Initializing Ollama models');

            this.llm = new Ollama({
                baseUrl: 'http://localhost:11434',
                model: 'llama3.1',
                numCtx: 8192
            });

            this.embeddings = new OllamaEmbeddings({
                baseUrl: 'http://localhost:11434',
                model: 'nomic-embed-text'
            });

            // Initialize vector store
            await vectorStoreManager.initialize();

            logger.info('RAG_INIT', 'Models initialized successfully');
        } catch (error) {
            logger.error('RAG_INIT', 'Failed to initialize models', error);
            throw error;
        }
    }

    async processPDF(filePath) {
        const operationId = `pdf_process_${Date.now()}`;
        logger.startTimer(operationId);

        try {
            logger.info('PDF_LOAD', 'Loading PDF file', { filePath });

            // Clear previous knowledge base to ensure we only answer from the new file
            // and strictly avoid duplicates.
            await vectorStoreManager.clearStore();

            const dataBuffer = fs.readFileSync(filePath);
            const pdfData = await pdfParse(dataBuffer);

            const docs = [new Document({
                pageContent: pdfData.text,
                metadata: {
                    source: filePath,
                    pages: pdfData.numpages
                }
            })];

            const loadDuration = logger.endTimer(operationId);
            logger.info('PDF_LOAD', 'PDF loaded successfully', {
                pageCount: pdfData.numpages,
                duration: loadDuration
            });

            logger.startTimer(`${operationId}_split`);
            const textSplitter = new RecursiveCharacterTextSplitter({
                chunkSize: 1000,
                chunkOverlap: 300 // Increased overlap for better continuity
            });

            const splitDocs = await textSplitter.splitDocuments(docs);
            const splitDuration = logger.endTimer(`${operationId}_split`);

            logger.info('TEXT_SPLIT', 'Text chunking completed', {
                chunkCount: splitDocs.length,
                chunkSize: 1000,
                overlap: 200,
                duration: splitDuration
            });

            logger.startTimer(`${operationId}_embed`);

            // Set global metadata for the file
            vectorStoreManager.setMetadata({
                filename: path.basename(filePath), // Get filename from path
                pageCount: pdfData.numpages,
                chunkCount: splitDocs.length
            });

            await vectorStoreManager.addDocuments(splitDocs, this.embeddings);
            const embedDuration = logger.endTimer(`${operationId}_embed`);

            logger.info('EMBEDDING', 'Embeddings generated and stored', {
                totalEmbeddings: splitDocs.length,
                model: 'nomic-embed-text',
                duration: embedDuration
            });

            return {
                success: true,
                pageCount: pdfData.numpages,
                chunkCount: splitDocs.length
            };
        } catch (error) {
            logger.error('PDF_PROCESS', 'PDF processing failed', error);
            throw error;
        }
    }

    async askQuestion(question, signal) {
        const operationId = `question_${Date.now()}`;
        logger.startTimer(operationId);

        try {
            if (signal?.aborted) {
                throw new Error('Request was aborted');
            }

            logger.info('QUESTION', 'Processing question', { question });

            logger.startTimer(`${operationId}_retrieval`);
            // MAXIMIZING CONTEXT: Increased k from 10 to 25.
            // With ~250 tokens per chunk, 25 chunks = ~6250 tokens.
            // This fills most of the 8192 context window, giving the AI maximum knowledge per question.
            const relevantDocs = await vectorStoreManager.similaritySearch(question, 25, this.embeddings);
            const retrievalDuration = logger.endTimer(`${operationId}_retrieval`);

            if (signal?.aborted) {
                throw new Error('Request was aborted');
            }

            logger.info('RETRIEVAL', 'Retrieved relevant chunks', {
                chunksRetrieved: relevantDocs.length,
                duration: retrievalDuration
            });

            logger.startTimer(`${operationId}_llm`);
            const context = relevantDocs.map(doc => doc.pageContent).join('\n\n');

            let prompt;
            // AUTO-DETECT QUIZ MODE
            if (question.toLowerCase().includes('quiz')) {
                logger.info('PROMPT_MODE', 'Using strict QUIZ mode with HARD VALIDATION');
                prompt = QUIZ_PROMPT_TEMPLATE(context, question);

                // For Quizzes, we BUFFER the response to validate it before sending.
                const fullResponse = await this.llm.invoke(prompt, { signal });
                const validJsonString = this.validateAndFixQuiz(fullResponse);

                // Create a simulated stream for consistent frontend handling
                const stream = (async function* () {
                    yield { content: validJsonString };
                })();

                return { stream, sourceDocuments: relevantDocs };

            } else {
                prompt = QA_PROMPT_TEMPLATE(context, question);
                // Standard streaming for normal questions
                const stream = await this.llm.stream(prompt, { signal });
                return { stream, sourceDocuments: relevantDocs };
            }
        } catch (error) {
            // Handle LangChain/Ollama cancellation
            if (error.name === 'AbortError' || error.message.includes('abort') || signal?.aborted) {
                logger.warn('QUESTION', 'Question processing cancelled by user');
                // Re-throw so server knows too, but maybe with a clear message
                throw new Error('Request cancelled by user');
            }
            logger.error('QUESTION', 'Question processing failed', error);
            throw error;
        }
    }

    validateAndFixQuiz(responseObj) {
        try {
            // Extract content whether it's an object (from invoke) or string
            let content = typeof responseObj === 'string' ? responseObj : responseObj.content;

            // Clean markdown wrappers if present
            content = content.replace(/```json/g, '').replace(/```/g, '').trim();

            const quiz = JSON.parse(content);

            if (!Array.isArray(quiz)) {
                throw new Error('Quiz output is not an array');
            }

            // HARD VALIDATION LOGIC
            const fixedQuiz = quiz.map(q => {
                const explanation = q.explanation || "";

                // If the explanation explicitly mentions an option text, align the answer index
                // Check each option to see if its text appears in the explanation
                let bestMatchIndex = -1;

                q.options.forEach((opt, idx) => {
                    // We check if the option text appears in the explanation
                    // We use a simple includes check, but could be fuzzier
                    if (explanation.includes(opt) || explanation.includes(`Option ${String.fromCharCode(65 + idx)}`)) {
                        bestMatchIndex = idx;
                    }
                });

                // If we found a match in the explanation, forces the answer index to match
                if (bestMatchIndex !== -1 && bestMatchIndex !== q.answer) {
                    logger.warn('QUIZ_FIX', `Correcting answer index for question: "${q.question.substring(0, 30)}..." from ${q.answer} to ${bestMatchIndex}`);
                    q.answer = bestMatchIndex;
                }

                return q;
            });

            return JSON.stringify(fixedQuiz, null, 2);

        } catch (e) {
            logger.error('QUIZ_VALIDATION', 'Failed to parse/validate quiz JSON', e);
            // Fallback: return original content if distinct parsing fails, 
            // relying on frontend error handling or showing raw text
            return typeof responseObj === 'string' ? responseObj : responseObj.content;
        }
    }

    getDocumentCount() {
        return vectorStoreManager.getDocumentCount();
    }

    getMetadata() {
        return vectorStoreManager.getMetadata();
    }
}

export default new RAGService();
