<template>
  <div class="chat-interface">
    <div class="messages" ref="messagesContainer">
      <div
        v-for="(message, index) in chatStore.messages"
        :key="index"
        :class="['message', message.type]"
      >
        <div class="message-content" v-html="renderMarkdown(message.content)"></div>
        <div class="message-meta-row">
            <span class="message-time">{{ formatTime(message.timestamp) }}</span>
            <button @click="copyToClipboard(message.content, index)" class="copy-btn" title="Copy message">
                {{ copiedIndex === index ? 'Copied!' : 'Copy' }}
            </button>
            <span v-if="message.meta" class="message-speed">
                ⚡ {{ message.meta.tps }} tokens/s ({{ message.meta.duration }}s)
            </span>
        </div>
      </div>
      <div v-if="chatStore.isLoading && !chatStore.isReceiving" class="message assistant loading">
        <div class="message-content">Thinking... ({{ thinkingTime }}s)</div>
      </div>
    </div>
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
import { ref, nextTick, watch } from 'vue';
import { useChatStore } from '@/stores/chatStore';
import { usePdfStore } from '@/stores/pdfStore';
import { marked } from 'marked';

const chatStore = useChatStore();
const pdfStore = usePdfStore();
const question = ref('');
const messagesContainer = ref(null);
const questionInput = ref(null);
const copiedIndex = ref(-1);

const thinkingTime = ref(0);
let thinkingInterval = null;

const renderMarkdown = (text) => {
  if (!text) return '';
  try {
      return marked(text);
  } catch (e) {
      console.error('Markdown rendering error:', e);
      return text || '';
  }
};

const copyToClipboard = async (text, index) => {
    try {
        await navigator.clipboard.writeText(text);
        copiedIndex.value = index;
        setTimeout(() => {
            if (copiedIndex.value === index) {
                copiedIndex.value = -1;
            }
        }, 2000);
    } catch (err) {
        console.error('Failed to copy text:', err);
    }
};

const handleEnter = (e) => {
  if (e.shiftKey) {
    // Let default behavior happen (newline)
    return;
  }
  // Send message
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
  
  // Reset height
  if (questionInput.value) {
    questionInput.value.style.height = 'auto';
    questionInput.value.style.height = 'auto'; // Force reset
  }

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
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

watch(() => chatStore.isLoading, (isLoading) => {
  if (isLoading) {
    thinkingTime.value = 0;
    thinkingInterval = setInterval(() => {
      thinkingTime.value++;
    }, 1000);
  } else {
    clearInterval(thinkingInterval);
    thinkingTime.value = 0;
  }
});

watch(() => chatStore.messages.length, () => {
  nextTick(() => scrollToBottom());
});
</script>

<style scoped>
.chat-interface {
  display: flex;
  flex-direction: column;
  flex: 1; /* Grow to fill parent */
  min-height: 0; /* Important for nested flex scrolling */
  border: 1px solid #333;
  background: #1e1e1e;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  scroll-behavior: smooth; /* Smooth scrolling for auto-scroll */
}

.message {
  margin-bottom: 15px;
  padding: 10px;
  border-radius: 4px;
  color: #e0e0e0;
  animation: fadeIn 0.3s ease-out; /* Fade in new messages */
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.message.user {
  background: #264f78;
  margin-left: 20%;
  color: #fff;
}

.message.assistant {
  background: #2d2d30;
  margin-right: 20%;
  transition: all 0.2s ease; /* Subtle transition for height changes */
}

.message.error {
  background: #3d1a1a;
  color: #ff9999;
}

.message.loading {
  font-style: italic;
  color: #888;
}

.message-content {
  margin-bottom: 5px;
}

/* Ensure parsed markdown looks good in dark mode */
.message-content :deep(a) {
    color: #4daafc;
}

.message-content :deep(code) {
    background: #111;
    padding: 2px 4px;
    border-radius: 3px;
    font-family: monospace;
}

.message-content :deep(pre) {
    background: #111;
    padding: 10px;
    border-radius: 4px;
    overflow-x: auto;
}

/* Improve paragraph formatting as requested */
.message-content :deep(p) {
    margin-bottom: 1.2em;
    /* text-indent: 1.5em; <--- Removed to match standard "Agent" format */
    line-height: 1.6;
}

/* Remove margin from last paragraph */
.message-content :deep(p:last-child) {
    margin-bottom: 0;
}

/* Fix bullet point bleeding */
.message-content :deep(ul),
.message-content :deep(ol) {
    padding-left: 25px; /* Ensure bullets stay inside */
    margin-bottom: 1em;
}

.message-time {
  font-size: 0.8em;
  color: #aaa;
}

.input-area {
  display: flex;
  padding: 15px;
  border-top: 1px solid #333;
  background: #252526;
  align-items: flex-end; /* Align button to bottom of textarea */
}

.question-input {
  flex: 1;
  padding: 10px;
  border: 1px solid #444;
  background: #1e1e1e;
  color: #e0e0e0;
  font-size: 14px;
  font-family: inherit;
  resize: none; /* Auto-resizing handles this */
  min-height: 42px;
  max-height: 200px; /* Don't grow forever */
  overflow-y: auto;
  border-radius: 4px;
}

.question-input:focus {
    outline: none;
    border-color: #007acc;
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
}

.send-btn:hover:not(:disabled) {
  background: #005999;
}

.send-btn:disabled {
  background: #444;
  color: #888;
  cursor: not-allowed;
}

.stop-btn {
  margin-left: 10px;
  padding: 10px 20px;
  background: #c62828;
  color: #fff;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
}

.stop-btn:hover {
  background: #d32f2f;
}

.message-meta-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 6px;
}

.message-speed {
    font-size: 0.75em;
    color: #666;
    background: #1a1a1a;
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid #333;
}

.copy-btn {
    font-size: 0.75em;
    color: #aaa;
    background: transparent;
    border: 1px solid #444;
    padding: 2px 8px;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
}

.copy-btn:hover {
    background: #333;
    color: #fff;
    border-color: #666;
}
</style>
