import { defineStore } from 'pinia';

export const useChatStore = defineStore('chat', {
    state: () => ({
        messages: [],
        isLoading: false,
        isReceiving: false, // New state for streaming
        error: null
    }),

    actions: {
        async askQuestion(question) {
            this.isLoading = true;
            this.isReceiving = false;
            this.error = null;

            // Create new controller for this request
            this.abortController = new AbortController();

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
                    body: JSON.stringify({ question }),
                    signal: this.abortController.signal
                });

                if (!response.ok) {
                    throw new Error('Failed to get answer');
                }


                // Initialize empty assistant message
                this.isReceiving = true;
                const messageIndex = this.messages.push({
                    type: 'assistant',
                    content: '', // Start empty
                    timestamp: new Date().toISOString(),
                    sources: []
                }) - 1;

                // Process the stream
                const reader = response.body.getReader();
                const metrics = await this.processStream(reader, messageIndex);

                this.messages[messageIndex].meta = metrics;

                this.isLoading = false;
                this.isReceiving = false;
                this.abortController = null;
            } catch (error) {
                this.handleRequestError(error);
            }
        },

        async processStream(reader, messageIndex) {
            const decoder = new TextDecoder();
            let buffer = '';
            let tokenCount = 0;
            const streamStartTime = Date.now();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop(); // Keep incomplete line in buffer

                for (const line of lines) {
                    if (line.trim()) {
                        tokenCount += await this.processStreamLine(line, messageIndex);
                    }
                }
            }

            const totalTime = (Date.now() - streamStartTime) / 1000;
            const tps = totalTime > 0 ? (tokenCount / totalTime).toFixed(1) : 0;

            return {
                duration: totalTime.toFixed(1),
                tps: tps,
                tokenCount: tokenCount
            };
        },

        async processStreamLine(line, messageIndex) {
            try {
                const event = JSON.parse(line);
                if (event.type === 'token') {
                    // SMOOTHING DELAY: Increasing this number makes the typing slower/smoother.
                    // Adjusted to 10ms for faster typing.
                    await new Promise(r => setTimeout(r, 10));

                    this.messages[messageIndex].content += event.content;
                    return 1; // Count as 1 token
                } else if (event.type === 'sources') {
                    this.messages[messageIndex].sources = event.data;
                }
            } catch (e) {
                console.error('Error parsing stream chunk', e);
            }
            return 0;
        },

        handleRequestError(error) {
            if (error.name === 'AbortError') {
                this.messages.push({
                    type: 'error',
                    content: 'Request cancelled by user.',
                    timestamp: new Date().toISOString()
                });
            } else {
                this.error = error.message;
                this.messages.push({
                    type: 'error',
                    content: 'Failed to get answer. Please try again.',
                    timestamp: new Date().toISOString()
                });
            }

            this.isLoading = false;
            this.isReceiving = false;
            this.abortController = null;
        },

        stopRequest() {

            if (this.abortController) {
                this.abortController.abort();
                this.abortController = null;
                this.isLoading = false;
            }
        },

        clearChat() {
            this.messages = [];
            this.error = null;
        }
    }
});
