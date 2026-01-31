import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OllamaEmbeddings } from '@langchain/community/embeddings/ollama';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { RetrievalQAChain } from 'langchain/chains';
import { Ollama } from '@langchain/community/llms/ollama';
import logger from '../utils/logger.js';

class RAGService {
    constructor() {
        this.vectorStore = null;
        this.llm = null;
        this.embeddings = null;
        this.initializeModels();
    }

    initializeModels() {
        try {
            logger.info('RAG_INIT', 'Initializing Ollama models');

            this.llm = new Ollama({
                baseUrl: 'http://localhost:11434',
                model: 'llama3.2:3b'
            });

            this.embeddings = new OllamaEmbeddings({
                baseUrl: 'http://localhost:11434',
                model: 'nomic-embed-text'
            });

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
            const loader = new PDFLoader(filePath);
            const docs = await loader.load();

            const loadDuration = logger.endTimer(operationId);
            logger.info('PDF_LOAD', 'PDF loaded successfully', {
                pageCount: docs.length,
                duration: loadDuration
            });

            logger.startTimer(`${operationId}_split`);
            const textSplitter = new RecursiveCharacterTextSplitter({
                chunkSize: 1000,
                chunkOverlap: 200
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
            this.vectorStore = await MemoryVectorStore.fromDocuments(
                splitDocs,
                this.embeddings
            );
            const embedDuration = logger.endTimer(`${operationId}_embed`);

            logger.info('EMBEDDING', 'Embeddings generated and stored', {
                totalEmbeddings: splitDocs.length,
                model: 'nomic-embed-text',
                duration: embedDuration
            });

            return {
                success: true,
                pageCount: docs.length,
                chunkCount: splitDocs.length
            };
        } catch (error) {
            logger.error('PDF_PROCESS', 'PDF processing failed', error);
            throw error;
        }
    }

    async askQuestion(question) {
        if (!this.vectorStore) {
            throw new Error('No PDF has been processed yet');
        }

        const operationId = `question_${Date.now()}`;
        logger.startTimer(operationId);

        try {
            logger.info('QUESTION', 'Processing question', { question });

            logger.startTimer(`${operationId}_retrieval`);
            const retriever = this.vectorStore.asRetriever(3);
            const relevantDocs = await retriever.getRelevantDocuments(question);
            const retrievalDuration = logger.endTimer(`${operationId}_retrieval`);

            logger.info('RETRIEVAL', 'Retrieved relevant chunks', {
                chunksRetrieved: relevantDocs.length,
                duration: retrievalDuration
            });

            logger.startTimer(`${operationId}_llm`);
            const chain = RetrievalQAChain.fromLLM(this.llm, retriever);
            const response = await chain.call({ query: question });
            const llmDuration = logger.endTimer(`${operationId}_llm`);

            const totalDuration = logger.endTimer(operationId);

            logger.info('LLM_RESPONSE', 'Answer generated', {
                model: 'llama3.2:3b',
                llmDuration,
                totalDuration
            });

            return {
                answer: response.text,
                sourceDocuments: relevantDocs
            };
        } catch (error) {
            logger.error('QUESTION', 'Question processing failed', error);
            throw error;
        }
    }
}

export default new RAGService();
