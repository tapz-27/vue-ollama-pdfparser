<template>
  <div class="sticky-wrapper">
    <div class="input-area">
      <textarea
        v-model="question"
        @keydown.enter.prevent="handleEnter"
        @input="autoResize"
        :disabled="!pdfStore.isProcessed || chatStore.isLoading"
        placeholder="Ask a question about the PDF... (Shift+Enter for new line)"
        class="question-input"
        ref="questionInput"
        rows="1"
      ></textarea>
      <button
        type="button"
        @click="sendQuestion"
        :disabled="!pdfStore.isProcessed || chatStore.isLoading || !question.trim()"
        class="send-btn"
      >
        {{ chatStore.isLoading ? 'Thinking...' : 'Send' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useChatStore } from '@/stores/chatStore';
import { usePdfStore } from '@/stores/pdfStore';

const chatStore = useChatStore();
const pdfStore = usePdfStore();
const question = ref('');
const questionInput = ref(null);

const handleEnter = (e) => {
  if (e.shiftKey) {
    return;
  }
  sendQuestion();
};

const autoResize = () => {
  if (questionInput.value) {
    questionInput.value.style.height = 'auto';
    questionInput.value.style.height = questionInput.value.scrollHeight + 'px';
  }
};

const sendQuestion = async () => {
  if (!question.value.trim() || chatStore.isLoading) {
    return;
  }

  const q = question.value;
  question.value = '';
  
  if (questionInput.value) {
    questionInput.value.style.height = 'auto';
    questionInput.value.style.height = 'auto';
  }

  try {
    await chatStore.askQuestion(q);
  } catch (error) {
    console.error('Failed to send question:', error);
  }
};
</script>

<style scoped>
.sticky-wrapper {
  position: sticky;
  bottom: 0;
  background-color: #121212; /* Match body background to act as mask */
  padding: 15px; /* Reduced specific padding */
  padding-top: 10px;
  z-index: 100;
  border-top: 1px solid transparent;
}

.input-area {
  display: flex;
  padding: 10px; /* Reduced from 15px */
  /* background & border removed previously */
  align-items: flex-end;
}

.question-input {
  flex: 1;
  padding: 8px; /* Reduced from 10px */
  border: 1px solid #444;
  background: #1e1e1e;
  color: #e0e0e0;
  font-size: 14px;
  line-height: 1.4; /* Explicit line height */
  font-family: inherit;
  resize: none;
  min-height: 38px; /* Reduced from 42px */
  max-height: 60vh;
  overflow-y: hidden;
  border-radius: 4px;
  transition: all 0.2s; /* Add smooth transition */
}

.question-input:hover {
  border-color: #007acc;
  background: #252526;
}

.question-input:focus {
    outline: none;
    border-color: #007acc;
    background: #1e1e1e; /* Optional: revert background on focus or keep consistent? keeping default for now */
}

.question-input:disabled {
  background: #2d2d30;
  color: #666;
  cursor: not-allowed;
}

.send-btn {
  margin-left: 10px;
  padding: 10px 20px;
  background: #007acc;
  color: #fff;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
  border-radius: 4px;
  margin-bottom: 2px;
}

.send-btn:hover:not(:disabled) {
  background: #005999;
}

.send-btn:disabled {
  background: #444;
  color: #888;
  cursor: not-allowed;
}
</style>
