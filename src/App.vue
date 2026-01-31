<template>
  <div id="app">
    <header>
      <h1>PDF Question Answering with Ollama</h1>
    </header>
    <main class="layout-grid">
      <div class="sidebar">
        <PdfUpload />
        <StatusPanel />
        <button 
          v-if="chatStore.isLoading" 
          @click="chatStore.stopRequest"
          class="sidebar-stop-btn"
        >
          Stop Generation
        </button>
        <button 
          v-if="!chatStore.isLoading && chatStore.messages.length > 0" 
          @click="chatStore.clearChat"
          class="sidebar-clear-btn"
        >
          Clear Chat
        </button>
      </div>
      <div class="main-content">
        <ChatInterface />
      </div>
    </main>
  </div>
</template>

<script setup>
import PdfUpload from './components/PdfUpload.vue';
import ChatInterface from './components/ChatInterface.vue';
import StatusPanel from './components/StatusPanel.vue';
import { useChatStore } from './stores/chatStore';

const chatStore = useChatStore();
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: #121212;
  color: #e0e0e0;
}

#app {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

header {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #333;
}

h1 {
  font-size: 24px;
  font-weight: 600;
  color: #fff;
}

.layout-grid {
  display: grid;
  grid-template-columns: 350px 1fr; /* Fixed width sidebar, flexible chat */
  gap: 20px;
  align-items: start;
}

.main-content {
  background: #1e1e1e;
  padding: 20px;
  border: 1px solid #333;
  border-radius: 8px;
  min-height: calc(100vh - 140px); /* Take full viewport height minus header/padding */
  display: flex;
  flex-direction: column;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: sticky; /* Make it stick */
  top: 20px;
  height: calc(100vh - 40px); /* Full height to contain scrollable areas if needed */
  overflow-y: auto;
}

/* Sidebar components usually have their own backgrounds, so we might not need a container bg here,
   but we can check individual components */

@media (max-width: 900px) {
  .layout-grid {
    grid-template-columns: 1fr;
  }
  
  .sidebar {
    position: static;
    height: auto;
  }
}

.sidebar-stop-btn {
  width: 100%;
  padding: 12px;
  background: #c62828;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 10px;
  transition: background 0.2s;
  border: 1px solid #b71c1c;
}

.sidebar-stop-btn:hover {
  background: #d32f2f;
}

.sidebar-clear-btn {
  width: 100%;
  padding: 12px;
  background: #424242;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 10px;
  transition: background 0.2s;
  border: 1px solid #555;
}

.sidebar-clear-btn:hover {
  background: #505050;
}
</style>
