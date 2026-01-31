import { defineStore } from 'pinia';

export const useDebugStore = defineStore('debug', {
    state: () => ({
        logs: [],
        isVisible: false
    }),

    actions: {
        addLog(log) {
            this.logs.push({
                ...log,
                id: Date.now() + Math.random()
            });
        },

        toggleVisibility() {
            this.isVisible = !this.isVisible;
        },

        clearLogs() {
            this.logs = [];
        }
    }
});
