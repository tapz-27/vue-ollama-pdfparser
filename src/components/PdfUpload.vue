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
        <p class="file-info">{{ formatFileSize(pdfStore.fileSize) }} - {{ pdfStore.pageCount }} pages - {{ pdfStore.chunkCount }} chunks</p>
        <button @click.stop="pdfStore.clearPdf" class="clear-btn">Clear</button>
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
import { ref } from 'vue';
import { usePdfStore } from '@/stores/pdfStore';

const pdfStore = usePdfStore();
const fileInput = ref(null);

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
  border: 2px dashed #ccc;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  background: #fafafa;
}

.upload-area:hover {
  border-color: #999;
  background: #f5f5f5;
}

.upload-prompt p {
  margin: 0;
  color: #666;
}

.upload-success {
  color: #333;
}

.file-info {
  font-size: 0.9em;
  color: #666;
  margin-top: 5px;
}

.clear-btn {
  margin-top: 10px;
  padding: 5px 15px;
  background: #fff;
  border: 1px solid #ccc;
  cursor: pointer;
}

.clear-btn:hover {
  background: #f0f0f0;
}

.processing {
  margin-top: 10px;
  color: #666;
  font-style: italic;
}

.error {
  margin-top: 10px;
  color: #d00;
}
</style>
