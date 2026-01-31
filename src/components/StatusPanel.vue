<template>
  <div class="status-panel">
    <div class="status-header">
      <span class="title">Activity Status</span>
      <span class="status-indicator" :class="{ active: isActive }">
        {{ isActive ? 'Processing...' : 'Idle' }}
      </span>
    </div>
    
    <div class="status-content">
      <div v-if="processedSteps.length === 0" class="empty-state">
        Ready to process PDF or answer questions.
      </div>
      
      <div v-else class="steps-list">
        <div 
          v-for="(step, index) in processedSteps" 
          :key="index"
          class="step-item"
          :class="{ 'is-latest': index === 0 }"
        >
          <div class="step-icon">
            <span v-if="step.type === 'error'">❌</span>
            <div v-else-if="index === 0 && isActive" class="loader"></div>
            <span v-else>✅</span>
          </div>
          
          <div class="step-details">
            <div class="step-message">{{ step.message }}</div>
            <div class="step-meta">
              <span class="step-time">{{ step.time }}</span>
              <span v-if="step.duration" class="step-duration">({{ step.duration }}ms)</span>
            </div>
            <div v-if="step.extra" class="step-extra">
              {{ step.extra }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useDebugStore } from '@/stores/debugStore';
import { computed, onMounted } from 'vue';

const debugStore = useDebugStore();

onMounted(() => {
  debugStore.connectLogs();
});

// Map technical operations to user friendly messages
const OPERATION_MAP = {
  'UPLOAD': 'Uploading PDF',
  'PDF_LOAD': 'Reading Document Structure',
  'TEXT_SPLIT': 'Analyzing & Chunking Text',
  'EMBEDDING': 'Learning Document Content',
  'QUESTION': 'Processing Question',
  'RETRIEVAL': 'Searching for Answers',
  'LLM_RESPONSE': 'Generating Intelligence',
  'RAG_INIT': 'System Initialization'
};

const processedSteps = computed(() => {
  return debugStore.logs
    .filter(log => log.level === 'INFO' || log.level === 'ERROR')
    .map(log => {
      const isError = log.level === 'ERROR';
      let message = OPERATION_MAP[log.operation] || log.message;
      let extra = null;
      let isComplete = false;

      // Add context based on operation and completion status
      if (log.operation === 'UPLOAD') {
         if (log.data?.totalDuration) {
             message = 'Upload & Processing Complete';
             isComplete = true;
         } else if (log.data?.filename) {
             extra = `File: ${log.data.filename}`;
         }
      } else if (log.operation === 'ASK') {
          if (log.message.includes('disconnected') || log.message.includes('cancelling')) {
              message = 'Generation Stopped by User';
              isComplete = true; // Mark as done so spinner stops
          } else if (log.message === 'Streaming completed') {
              isComplete = true;
              message = 'Answer Generated';
          }
      } else if (log.operation === 'LLM_RESPONSE') {
        extra = `Used ${log.data?.contextDocsUsed || 0} document chunks`;
        isComplete = true; // Response means we are done
      } else if (log.operation === 'RETRIEVAL') {
        extra = `Found ${log.data?.chunksRetrieved || 0} relevant sections`;
      } else if (log.operation === 'EMBEDDING' && log.data?.duration) {
          isComplete = true;
      }

      return {
        type: isError ? 'error' : 'info',
        operation: log.operation,
        message: message,
        time: new Date(log.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        duration: log.data?.duration || log.data?.totalDuration,
        extra,
        isComplete
      };
    })
    .slice(0, 4); // Compact view: show only last 4 steps
});

const isActive = computed(() => {
    if (processedSteps.value.length === 0) return false;
    const lastStep = processedSteps.value[0];
    
    // If the latest step is a "complete" step or an error, we are idle.
    if (lastStep.isComplete || lastStep.type === 'error') return false;

    // Otherwise, check if it's stale (older than 10 seconds)
    const now = Date.now();
    // We need to parse the time string back or access original log timestamp. 
    // Accessing store directly is safer:
    const lastLogTime = new Date(debugStore.logs[0]?.timestamp).getTime();
    return (now - lastLogTime) < 10000; 
});
</script>

<style scoped>
.status-panel {
  margin-top: 20px;
  background: #1e1e1e;
  border: 1px solid #333;
  border-radius: 8px;
  overflow: hidden;
  font-family: 'Segoe UI', sans-serif;
  color: #e0e0e0;
  /* box-shadow removed for cleaner look */
}

.status-header {
  padding: 12px 16px;
  background: #252526;
  border-bottom: 1px solid #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-weight: 600;
  font-size: 14px;
  color: #fff;
  letter-spacing: 0.5px;
}

.status-indicator {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  background: #333;
  color: #888;
  transition: all 0.3s ease;
}

.status-indicator.active {
  background: #007acc;
  color: #fff;
  box-shadow: 0 0 8px rgba(0, 122, 204, 0.5);
}

.status-content {
  padding: 0;
  /* Removed max-height and overflow for compact, auto-sizing view */
}

.empty-state {
  padding: 20px;
  text-align: center;
  color: #666;
  font-style: italic;
  font-size: 0.9em;
}

.steps-list {
  display: flex;
  flex-direction: column;
}

.step-item {
  padding: 8px 12px; /* Reduced padding */
  border-bottom: 1px solid #2a2a2a;
  display: flex;
  align-items: center; /* Center vertically */
  transition: background 0.2s;
}

.step-item:last-child {
  border-bottom: none;
}

.step-item:hover {
  background: #2a2a2a;
}

.step-item.is-latest {
  background: #262629;
  border-left: 3px solid #007acc;
}

.step-icon {
  margin-right: 12px;
  font-size: 16px;
  width: 24px;
  text-align: center;
  display: flex; /* Center loader */
  justify-content: center;
}

.step-details {
  flex: 1;
}

.step-message {
  font-weight: 500;
  font-size: 14px;
  color: #eee;
  margin-bottom: 2px;
}

.step-meta {
  font-size: 11px;
  color: #888;
  display: flex;
  gap: 8px;
}

.step-extra {
  margin-top: 4px;
  font-size: 12px;
  color: #aaa;
  background: #333;
  padding: 2px 6px;
  border-radius: 4px;
  display: inline-block;
}

/* Animations */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loader {
  width: 14px;
  height: 14px;
  border: 2px solid #555;
  border-top-color: #007acc;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
</style>
