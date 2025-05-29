# 🚀 Quick Start Guide

Get your Light RAG system running in 5 minutes!

## Prerequisites Check

✅ **Python 3.8+** - Run: `python --version`  
✅ **Node.js 18+** - Run: `node --version`  
✅ **Ollama** - Install from: https://ollama.ai/download

## 1-Click Setup (Windows)

```bash
# Run the setup script
setup.bat
```

## Manual Setup

### Step 1: Install Ollama & Mistral
```bash
# Install Ollama (if not already installed)
winget install Ollama.Ollama

# Pull Mistral model
ollama pull mistral
```

### Step 2: Setup Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### Step 3: Setup Frontend
```bash
cd frontend
npm install
```

## 🚀 Start Everything

### Option 1: Use Start Script (Windows)
```bash
start.bat
```

### Option 2: Manual Start
```bash
# Terminal 1: Start Ollama
ollama run mistral

# Terminal 2: Start Backend
cd backend
venv\Scripts\activate
python main.py

# Terminal 3: Start Frontend
cd frontend
npm run dev
```

## 🎉 You're Ready!

1. Open **http://localhost:3000**
2. Upload the `sample_document.txt` file
3. Ask: "What is RAG and how does it work?"
4. Watch the magic happen! ✨

## 🔧 Troubleshooting

**Problem**: "Cannot connect to Ollama"  
**Solution**: Make sure `ollama run mistral` is running

**Problem**: "Backend connection failed"  
**Solution**: Check if backend is running on port 8000

**Problem**: "Upload failed"  
**Solution**: Only PDF, DOCX, and TXT files are supported

## 📚 What to Try

1. **Upload Documents**: Try different file types (PDF, DOCX, TXT)
2. **Ask Questions**: Query your uploaded documents
3. **Toggle RAG**: Turn off RAG to chat directly with Mistral
4. **Test Sources**: See which documents were used for answers

Enjoy your Light RAG system! 🎊 