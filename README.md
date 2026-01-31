# Vue.js + Ollama PDF Parser

A minimalist application that allows users to upload PDF files and ask questions about their content using Ollama's local LLM capabilities with RAG (Retrieval Augmented Generation).

## Features

- Upload PDF files and extract text content
- Ask questions about the PDF content using natural language
- RAG-powered answers using LangChain.js and Ollama
- Real-time debug logging panel
- Minimalist, clean UI design

## Prerequisites

Before running this application, you need to have:

1. **Node.js** (v18 or higher)
2. **Ollama** installed and running locally
3. Required Ollama models:
   - `llama3.1` - For question answering
   - `nomic-embed-text` - For text embeddings

### Installing Ollama Models

```bash
ollama pull llama3.1
ollama pull nomic-embed-text
```

Verify the models are installed:

```bash
ollama list
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/vue-ollama-pdfparser.git
cd vue-ollama-pdfparser
```

2. Install dependencies:
```bash
npm install --legacy-peer-deps
```

## Running the Application

### Option 1: Run both frontend and backend together
```bash
npm start
```

### Option 2: Run separately

Terminal 1 - Backend server:
```bash
npm run server
```

Terminal 2 - Frontend dev server:
```bash
npm run dev
```

### Option 3: One-Click Start (Windows)
Double-click the `start_app.bat` file in the root directory. This will launch both the server and the client in a new window.

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## Usage

1. **Upload a PDF**: Click or drag a PDF file into the upload area
2. **Wait for processing**: The PDF will be parsed, chunked, and embedded
3. **Ask questions**: Type your question in the chat interface
4. **Control Generation**: Use the "Stop Generation" button to cancel a request
5. **Clear History**: Use "Clear Chat" to reset the conversation
6. **View Status**: Check the status panel for system readiness and document counts

## Architecture

### RAG Pipeline

1. **PDF Processing**: PDFs are loaded using LangChain's PDFLoader
2. **Text Chunking**: Documents are split into chunks using RecursiveCharacterTextSplitter
3. **Embedding Generation**: Each chunk is embedded using Ollama's nomic-embed-text model
4. **Vector Storage**: Embeddings are stored in an in-memory vector store
5. **Question Answering**: Questions are embedded and similar chunks are retrieved
6. **Answer Generation**: Retrieved context is sent to llama3.1 for answer generation

### Tech Stack

- **Frontend**: Vue 3 (Composition API), Pinia
- **Backend**: Node.js, Express
- **RAG Framework**: LangChain.js
- **LLM**: Ollama (llama3.1, nomic-embed-text)
- **Build Tool**: Vite

## Project Structure

```
vue-ollama-pdfparser/
├── server.js                 # Express backend server
├── services/
│   └── ragService.js        # RAG orchestration
├── utils/
│   └── logger.js            # Centralized logging
├── src/
│   ├── components/
│   │   ├── PdfUpload.vue    # PDF upload component
│   │   ├── ChatInterface.vue # Q&A chat interface
│   │   └── StatusPanel.vue   # Server status and metrics
│   ├── stores/
│   │   ├── pdfStore.js      # PDF state management
│   │   ├── chatStore.js     # Chat state management
│   │   └── debugStore.js    # Debug logs state
│   ├── App.vue              # Main app component
│   └── main.js              # App entry point
└── package.json
```

## License

MIT
