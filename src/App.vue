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
        <ChatInput />
      </div>
    </main>
  </div>
</template>

<script setup>
import PdfUpload from './components/PdfUpload.vue';
import ChatInterface from './components/ChatInterface.vue';
import ChatInput from './components/ChatInput.vue';
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
  width: 90vw; /* Force width */
  margin: 0 auto;
  padding: 20px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
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
  grid-template-columns: 350px 1fr;
  gap: 20px;
  align-items: start;
}

.main-content {
  /* background & border removed */
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 140px); /* Fill screen so input sits at bottom */
  position: relative;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: sticky;
  top: 20px;
  height: auto;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
}

@media (max-width: 900px) {
  .layout-grid {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }
  
  .sidebar {
    height: auto;
    max-height: 300px; /* Limit sidebar height on mobile */
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
