<template>
  <div class="pdf-upload">
    <div class="upload-area" @click="triggerFileInput" @drop.prevent="handleDrop" @dragover.prevent>
      <input
        ref="fileInput"
        type="file"
        accept=".pdf"
        @change="handleFileSelect"
        style="display: none"
      />
      <div v-if="!pdfStore.isProcessed" class="upload-prompt">
        <p>Click or drag PDF file here</p>
      </div>
      <div v-else class="upload-success">
        <p>{{ pdfStore.fileName }}</p>
        <p class="file-info">
            <span v-if="pdfStore.fileSize">{{ formatFileSize(pdfStore.fileSize) }} - </span>
            <span v-if="pdfStore.pageCount">{{ pdfStore.pageCount }} pages - </span>
            {{ pdfStore.chunkCount }} chunks
        </p>
        <button @click.stop="pdfStore.clearPdf" class="clear-btn">Upload New PDF</button>
      </div>
    </div>
    <div v-if="pdfStore.isProcessing" class="processing">
      Processing PDF...
    </div>
    <div v-if="pdfStore.error" class="error">
      Error: {{ pdfStore.error }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { usePdfStore } from '@/stores/pdfStore';

const pdfStore = usePdfStore();
const fileInput = ref(null);

onMounted(() => {
  pdfStore.checkServerStatus();
});

const triggerFileInput = () => {
  if (!pdfStore.isProcessed) {
    fileInput.value.click();
  }
};

const handleFileSelect = async (event) => {
  const file = event.target.files[0];
  if (file) {
    await pdfStore.uploadPdf(file);
  }
};

const handleDrop = async (event) => {
  if (pdfStore.isProcessed) {
    return;
  }
  const file = event.dataTransfer.files[0];
  if (file && file.type === 'application/pdf') {
    await pdfStore.uploadPdf(file);
  }
};

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return 'Cached';
  if (bytes < 1024) {
    return bytes + ' B';
  }
  if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(1) + ' KB';
  }
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};
</script>

<style scoped>
.pdf-upload {
  margin-bottom: 20px;
}

.upload-area {
  border: 2px dashed #444;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  background: #1e1e1e;
  transition: all 0.2s;
}

.upload-area:hover {
  border-color: #007acc;
  background: #252526;
}

.upload-prompt p {
  margin: 0;
  color: #aaa;
}

.upload-success {
  color: #e0e0e0;
}

.file-info {
  font-size: 0.9em;
  color: #888;
  margin-top: 5px;
}

.clear-btn {
  margin-top: 10px;
  padding: 5px 15px;
  background: #333;
  color: #e0e0e0;
  border: 1px solid #555;
  cursor: pointer;
  transition: background 0.2s;
}

.clear-btn:hover {
  background: #444;
}

.processing {
  margin-top: 10px;
  color: #aaa;
  font-style: italic;
}

.error {
  margin-top: 10px;
  color: #ff5555;
}
</style>
