import { defineStore } from 'pinia';

export const useChatStore = defineStore('chat', {
    state: () => ({
        messages: [],
        isLoading: false,
        error: null
    }),

    actions: {
        async askQuestion(question) {
            this.isLoading = true;
            this.error = null;

            this.messages.push({
                type: 'user',
                content: question,
                timestamp: new Date().toISOString()
            });

            try {
                const response = await fetch('http://localhost:3000/api/ask', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ question })
                });

                if (!response.ok) {
                    throw new Error('Failed to get answer');
                }

                const data = await response.json();

                this.messages.push({
                    type: 'assistant',
                    content: data.answer,
                    timestamp: new Date().toISOString(),
                    sources: data.sourceDocuments
                });

                this.isLoading = false;
                return data;
            } catch (error) {
                this.error = error.message;
                this.isLoading = false;

                this.messages.push({
                    type: 'error',
                    content: 'Failed to get answer. Please try again.',
                    timestamp: new Date().toISOString()
                });

                throw error;
            }
        },

        clearChat() {
            this.messages = [];
            this.error = null;
        }
    }
});
