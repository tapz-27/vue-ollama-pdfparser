import { defineStore } from 'pinia';

export const usePdfStore = defineStore('pdf', {
    state: () => ({
        uploadedFile: null,
        fileName: '',
        fileSize: 0,
        pageCount: 0,
        chunkCount: 0,
        isProcessing: false,
        isProcessed: false,
        error: null
    }),

    actions: {
        async uploadPdf(file) {
            this.isProcessing = true;
            this.error = null;
            this.fileName = file.name;
            this.fileSize = file.size;

            const formData = new FormData();
            formData.append('pdf', file);

            try {
                const response = await fetch('http://localhost:3000/api/upload', {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    throw new Error('Upload failed');
                }

                const data = await response.json();

                this.uploadedFile = file;
                this.pageCount = data.pageCount;
                this.chunkCount = data.chunkCount;
                this.isProcessed = true;
                this.isProcessing = false;

                return data;
            } catch (error) {
                this.error = error.message;
                this.isProcessing = false;
                throw error;
            }
        },

        clearPdf() {
            this.uploadedFile = null;
            this.fileName = '';
            this.fileSize = 0;
            this.pageCount = 0;
            this.chunkCount = 0;
            this.isProcessed = false;
            this.error = null;
        }
    }
});
