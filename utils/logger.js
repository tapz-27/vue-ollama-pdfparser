const LOG_LEVELS = {
    DEBUG: 'DEBUG',
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR'
};

import { EventEmitter } from 'events';

class Logger extends EventEmitter {
    constructor() {
        super();
        this.startTimes = new Map();
    }

    formatTimestamp() {
        return new Date().toISOString();
    }

    log(level, operation, message, data = null) {
        const logEntry = {
            // timestamp: this.formatTimestamp(),
            level,
            operation,
            message
        };

        if (data) {
            logEntry.data = data;
        }

        const logString = JSON.stringify(logEntry);
        console.log(logString);

        // Emit the log event for SSE
        this.emit('log', logEntry);

        return logEntry;
    }

    startTimer(operationId) {
        this.startTimes.set(operationId, Date.now());
    }

    endTimer(operationId) {
        const startTime = this.startTimes.get(operationId);
        if (!startTime) {
            return null;
        }
        const duration = Date.now() - startTime;
        this.startTimes.delete(operationId);
        return duration;
    }

    debug(operation, message, data) {
        return this.log(LOG_LEVELS.DEBUG, operation, message, data);
    }

    info(operation, message, data) {
        return this.log(LOG_LEVELS.INFO, operation, message, data);
    }

    warn(operation, message, data) {
        return this.log(LOG_LEVELS.WARN, operation, message, data);
    }

    error(operation, message, error) {
        const errorData = error ? {
            message: error.message,
            stack: error.stack
        } : null;
        return this.log(LOG_LEVELS.ERROR, operation, message, errorData);
    }
}

export default new Logger();
