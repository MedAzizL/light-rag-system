# Light RAG - AI Document Assistant

A lightweight Retrieval-Augmented Generation (RAG) system for intelligent document-based question answering.

## 🚀 Tech Stack

- **Backend**: FastAPI + ChromaDB + TF-IDF (scikit-learn)
- **Frontend**: Next.js + TypeScript + Tailwind CSS + Axios
- **Vector Store**: ChromaDB (In-memory)
- **Embeddings**: TF-IDF Vectorizer (500 dimensions)
- **Document Processing**: PyPDF2, python-docx
- **Optional LLM**: Ollama (graceful fallback without it)

## 📋 Features

• **Upload & Traitement**: Importation automatique de documents PDF, DOCX et TXT avec découpage intelligent en chunks

• **Recherche Vectorielle**: Indexation et recherche sémantique dans les documents uploadés via embeddings TF-IDF

• **Chat Intelligent**: Interface conversationnelle avec RAG permettant de poser des questions et obtenir des réponses basées sur le contenu des documents

## 🛠️ Installation

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
```

## 🚀 Running the Application

### 1. Start Backend

```bash
# In backend directory with activated virtual environment
cd backend
venv\Scripts\activate
python main.py
```

Backend runs on `http://localhost:8000`

### 2. Start Frontend

```bash
# In frontend directory
cd frontend
npm run dev
```

Frontend runs on `http://localhost:3000`

## 📖 Usage

1. **Open browser** → `http://localhost:3000`

2. **Upload Documents**: 
   - Click "Upload Document"
   - Supports PDF, DOCX, TXT files
   - Auto-processing with TF-IDF embeddings

3. **Chat with RAG**:
   - Enable "Use RAG (Document Search)"
   - Ask questions about uploaded documents
   - Get answers with source attribution

4. **Document Management**:
   - View uploaded documents
   - Clear all documents

## 📁 Project Structure

```
Light_RAG/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── requirements.txt     # Python dependencies
│   └── venv/               # Virtual environment
├── frontend/
│   ├── src/
│   │   └── app/
│   │       ├── page.tsx     # Main interface
│   │       ├── layout.tsx   # App layout
│   │       └── globals.css  # Styles
│   ├── package.json         # Dependencies
│   └── tailwind.config.ts   # Tailwind config
└── README.md
```

## 🔌 API Endpoints

- `GET /` - Health check
- `POST /upload` - Upload documents
- `POST /chat` - Chat with RAG
- `GET /documents` - List documents
- `DELETE /documents` - Clear all

## 🔧 Technical Details

- **Embedding Dimensions**: 500 (fixed, TF-IDF)
- **Text Chunking**: 500 words, 50 overlap
- **Supported Formats**: PDF, DOCX, TXT
- **Vector Search**: ChromaDB similarity search
- **Frontend**: Modern React with TypeScript
- **Styling**: Tailwind CSS responsive design

## 🛠️ Configuration

### Backend (FastAPI)
- Port: 8000
- CORS enabled for frontend
- ChromaDB in-memory storage
- TF-IDF max features: 500

### Frontend (Next.js)
- Port: 3000
- TypeScript strict mode
- Tailwind CSS framework
- Axios for API calls

## 🔍 Troubleshooting

### Common Issues

1. **"Upload failed"**
   - Check file format (PDF/DOCX/TXT only)
   - Restart backend if dimension errors

2. **"Backend connection failed"**
   - Ensure backend runs on port 8000
   - Check Python dependencies

3. **"No documents shown"**
   - Clear browser cache
   - Refresh page (F5)

### Performance Tips

- **Large Documents**: Processing time varies by size
- **Memory**: ChromaDB stores embeddings in memory
- **First Upload**: TF-IDF vectorizer training on first document

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## 📜 License

MIT License - Feel free to use and modify!

## 🎯 Keywords

`RAG` `FastAPI` `Next.js` `ChromaDB` `TF-IDF` `TypeScript` `Python` `Document Processing` `Vector Search` `AI Assistant` 