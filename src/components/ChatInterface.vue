<template>
  <div class="chat-interface">
    <div class="messages" ref="messagesContainer">
      <div
        v-for="(message, index) in chatStore.messages"
        :key="index"
        :class="['message', message.type]"
      >
        <div class="message-content">{{ message.content }}</div>
        <div class="message-time">{{ formatTime(message.timestamp) }}</div>
      </div>
      <div v-if="chatStore.isLoading" class="message assistant loading">
        <div class="message-content">Thinking...</div>
      </div>
    </div>
    <div class="input-area">
      <input
        v-model="question"
        @keyup.enter="sendQuestion"
        :disabled="!pdfStore.isProcessed || chatStore.isLoading"
        placeholder="Ask a question about the PDF..."
        class="question-input"
      />
      <button
        @click="sendQuestion"
        :disabled="!pdfStore.isProcessed || chatStore.isLoading || !question.trim()"
        class="send-btn"
      >
        Send
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, watch } from 'vue';
import { useChatStore } from '@/stores/chatStore';
import { usePdfStore } from '@/stores/pdfStore';

const chatStore = useChatStore();
const pdfStore = usePdfStore();
const question = ref('');
const messagesContainer = ref(null);

const sendQuestion = async () => {
  if (!question.value.trim() || chatStore.isLoading) {
    return;
  }

  const q = question.value;
  question.value = '';

  try {
    await chatStore.askQuestion(q);
    await nextTick();
    scrollToBottom();
  } catch (error) {
    console.error('Failed to send question:', error);
  }
};

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString();
};

watch(() => chatStore.messages.length, () => {
  nextTick(() => scrollToBottom());
});
</script>

<style scoped>
.chat-interface {
  display: flex;
  flex-direction: column;
  height: 500px;
  border: 1px solid #ddd;
  background: #fff;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.message {
  margin-bottom: 15px;
  padding: 10px;
  border-radius: 4px;
}

.message.user {
  background: #e3f2fd;
  margin-left: 20%;
}

.message.assistant {
  background: #f5f5f5;
  margin-right: 20%;
}

.message.error {
  background: #ffebee;
  color: #c62828;
}

.message.loading {
  font-style: italic;
  color: #666;
}

.message-content {
  margin-bottom: 5px;
}

.message-time {
  font-size: 0.8em;
  color: #999;
}

.input-area {
  display: flex;
  padding: 15px;
  border-top: 1px solid #ddd;
  background: #fafafa;
}

.question-input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ccc;
  font-size: 14px;
}

.question-input:disabled {
  background: #f0f0f0;
  cursor: not-allowed;
}

.send-btn {
  margin-left: 10px;
  padding: 10px 20px;
  background: #333;
  color: #fff;
  border: none;
  cursor: pointer;
}

.send-btn:hover:not(:disabled) {
  background: #555;
}

.send-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
