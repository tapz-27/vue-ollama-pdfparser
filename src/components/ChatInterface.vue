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
  </div>
</template>

<script setup>
import { ref, nextTick, watch } from 'vue';
import { useChatStore } from '@/stores/chatStore';
import { marked } from 'marked';

const chatStore = useChatStore();
const messagesContainer = ref(null);
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
  /* background removed */
}

.messages {
  display: flex; /* Enable flexbox for children alignment */
  flex-direction: column;
  padding: 20px;
  /* padding-bottom will be handled by the input wrapper or just flow naturally until the sticky input covers it */
  scroll-behavior: smooth;
}

.message {
  margin-bottom: 15px;
  padding: 10px;
  border-radius: 4px;
  color: #e0e0e0;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.message.user {
  background: #264f78;
  align-self: flex-end; /* Align right */
  width: fit-content; /* Shrink to fit text */
  max-width: 80%; /* Don't get too wide */
  color: #fff;
}

.message.assistant {
  background: transparent;
  color: #e0e0e0;
  align-self: flex-start; /* Align left */
  width: 100%; /* Full width as requested */
  margin-right: 0;
  padding-left: 0;
  transition: all 0.2s ease;
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

.message-content :deep(p) {
    margin-bottom: 1.2em;
    line-height: 1.6;
}

.message-content :deep(p:last-child) {
    margin-bottom: 0;
}

.message-content :deep(ul),
.message-content :deep(ol) {
    padding-left: 25px;
    margin-bottom: 1em;
}

.message-time {
  font-size: 0.8em;
  color: #aaa;
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
