import fs from 'fs';
import path from 'path';
import logger from '../utils/logger.js';

class VectorStoreManager {
    constructor() {
        this.documents = [];
        this.vectors = [];
        this.metadata = null; // Store global file info
        this.storePath = './vector_store.json';
    }

    async initialize() {
        try {
            if (fs.existsSync(this.storePath)) {
                logger.info('VECTOR_STORE', 'Loading existing vector store from disk');
                const data = JSON.parse(fs.readFileSync(this.storePath, 'utf-8'));
                this.documents = data.documents;
                this.vectors = data.vectors;
                this.metadata = data.metadata || null;
                logger.info('VECTOR_STORE', 'Vector store loaded', { count: this.documents.length });
            } else {
                logger.info('VECTOR_STORE', 'No existing vector store found, starting fresh');
            }
        } catch (error) {
            logger.error('VECTOR_STORE', 'Failed to load vector store', error);
        }
    }

    async clearStore() {
        this.documents = [];
        this.vectors = [];
        this.metadata = null;
        try {
            if (fs.existsSync(this.storePath)) {
                fs.unlinkSync(this.storePath);
            }
            logger.info('VECTOR_STORE', 'Vector store cleared');
        } catch (error) {
            logger.error('VECTOR_STORE', 'Failed to clear vector store', error);
        }
    }

    setMetadata(metadata) {
        this.metadata = metadata;
    }

    getMetadata() {
        return this.metadata;
    }

    async addDocuments(docs, embeddings) {
        // Generate embeddings for new docs
        for (const doc of docs) {
            const vector = await embeddings.embedQuery(doc.pageContent);
            this.documents.push(doc);
            this.vectors.push(vector);
        }

        await this.save();
    }

    async save() {
        try {
            const data = {
                documents: this.documents,
                vectors: this.vectors,
                metadata: this.metadata
            };
            fs.writeFileSync(this.storePath, JSON.stringify(data));
            logger.info('VECTOR_STORE', 'Vector store saved to disk');
        } catch (error) {
            logger.error('VECTOR_STORE', 'Failed to save vector store', error);
        }
    }

    cosineSimilarity(vecA, vecB) {
        const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
        const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
        const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
        if (magnitudeA === 0 || magnitudeB === 0) return 0;
        return dotProduct / (magnitudeA * magnitudeB);
    }

    getDocumentCount() {
        return this.documents.length;
    }

    async similaritySearch(query, k, embeddings) {
        if (this.documents.length === 0) {
            throw new Error('Vector store is empty. Please upload a PDF first.');
        }

        const queryVector = await embeddings.embedQuery(query);

        const similarities = this.vectors.map((vector, index) => ({
            document: this.documents[index],
            similarity: this.cosineSimilarity(queryVector, vector)
        }));

        similarities.sort((a, b) => b.similarity - a.similarity);

        return similarities.slice(0, k).map(item => item.document);
    }
}

export default new VectorStoreManager();
