<template>
  <div class="debug-panel" :class="{ collapsed: !debugStore.isVisible }">
    <div class="debug-header" @click="debugStore.toggleVisibility">
      <span>Debug Logs ({{ debugStore.logs.length }})</span>
      <span class="toggle">{{ debugStore.isVisible ? '▼' : '▲' }}</span>
    </div>
    <div v-if="debugStore.isVisible" class="debug-content">
      <button @click="debugStore.clearLogs" class="clear-logs-btn">Clear Logs</button>
      <div class="logs">
        <div
          v-for="log in debugStore.logs"
          :key="log.id"
          :class="['log-entry', log.level.toLowerCase()]"
        >
          <span class="log-time">{{ formatTime(log.timestamp) }}</span>
          <span class="log-level">{{ log.level }}</span>
          <span class="log-operation">{{ log.operation }}</span>
          <span class="log-message">{{ log.message }}</span>
          <pre v-if="log.data" class="log-data">{{ JSON.stringify(log.data, null, 2) }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useDebugStore } from '@/stores/debugStore';

const debugStore = useDebugStore();

const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString();
};
</script>

<style scoped>
.debug-panel {
  margin-top: 20px;
  border: 1px solid #ddd;
  background: #fff;
}

.debug-panel.collapsed .debug-content {
  display: none;
}

.debug-header {
  padding: 10px;
  background: #333;
  color: #fff;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.debug-header:hover {
  background: #555;
}

.toggle {
  font-size: 0.8em;
}

.debug-content {
  max-height: 400px;
  overflow-y: auto;
}

.clear-logs-btn {
  margin: 10px;
  padding: 5px 10px;
  background: #fff;
  border: 1px solid #ccc;
  cursor: pointer;
}

.clear-logs-btn:hover {
  background: #f0f0f0;
}

.logs {
  padding: 10px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.log-entry {
  padding: 8px;
  margin-bottom: 5px;
  border-left: 3px solid #ccc;
  background: #fafafa;
}

.log-entry.debug {
  border-left-color: #2196f3;
}

.log-entry.info {
  border-left-color: #4caf50;
}

.log-entry.warn {
  border-left-color: #ff9800;
}

.log-entry.error {
  border-left-color: #f44336;
  background: #ffebee;
}

.log-time {
  color: #999;
  margin-right: 10px;
}

.log-level {
  font-weight: bold;
  margin-right: 10px;
}

.log-operation {
  color: #666;
  margin-right: 10px;
}

.log-message {
  color: #333;
}

.log-data {
  margin-top: 5px;
  padding: 5px;
  background: #fff;
  border: 1px solid #ddd;
  overflow-x: auto;
  font-size: 11px;
}
</style>
