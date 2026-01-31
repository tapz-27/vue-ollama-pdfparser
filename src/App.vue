<template>
  <div id="app">
    <header>
      <h1>PDF Question Answering with Ollama</h1>
    </header>
    <main>
      <PdfUpload />
      <ChatInterface />
      <DebugPanel />
    </main>
  </div>
</template>

<script setup>
import PdfUpload from './components/PdfUpload.vue';
import ChatInterface from './components/ChatInterface.vue';
import DebugPanel from './components/DebugPanel.vue';
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: #f5f5f5;
  color: #333;
}

#app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

header {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #ddd;
}

h1 {
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

main {
  background: #fff;
  padding: 30px;
  border: 1px solid #ddd;
}
</style>
