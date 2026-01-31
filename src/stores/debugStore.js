import { defineStore } from 'pinia';

export const useDebugStore = defineStore('debug', {
    state: () => ({
        logs: [],
        isVisible: false,
        eventSource: null
    }),

    actions: {
        addLog(log) {
            this.logs.unshift({ // Add new logs to the top
                ...log,
                id: Date.now() + Math.random()
            });
            // Keep only last 1000 logs to prevent memory issues
            if (this.logs.length > 1000) {
                this.logs.pop();
            }
        },

        toggleVisibility() {
            this.isVisible = !this.isVisible;
        },

        clearLogs() {
            this.logs = [];
        },

        connectLogs() {
            if (this.eventSource) return;

            this.eventSource = new EventSource('http://localhost:3000/api/logs');

            this.eventSource.onmessage = (event) => this.handleLogMessage(event);
            this.eventSource.onerror = (error) => this.handleLogConnectionError(error);
        },

        handleLogMessage(event) {
            try {
                const log = JSON.parse(event.data);
                this.addLog(log);
            } catch (e) {
                console.error('Failed to parse log event:', e);
            }
        },

        handleLogConnectionError(error) {
            console.error('EventSource failed:', error);
            if (this.eventSource) {
                this.eventSource.close();
                this.eventSource = null;
            }

            // Infinite Spam Prevention
            this.retryCount = (this.retryCount || 0) + 1;
            if (this.retryCount > 5) {
                console.warn('Max log connection retries reached. Giving up.');
                return; // Stop trying
            }

            // Try to reconnect after 5s
            setTimeout(() => this.connectLogs(), 5000);
        }
    }
});
