from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import chromadb
from sklearn.feature_extraction.text import TfidfVectorizer
import requests
import json
import os
from typing import List, Optional
import PyPDF2
import docx
import io
import uuid
import numpy as np

app = FastAPI(title="Light RAG API", version="1.0.0")

# CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components with simple TF-IDF embeddings
print("🚀 Starting Light RAG API...")
# Fixed dimension TF-IDF vectorizer
EMBEDDING_DIM = 500  # Fixed dimension for all embeddings
vectorizer = TfidfVectorizer(max_features=EMBEDDING_DIM, stop_words='english')
chroma_client = chromadb.Client()

# Create or get collection
try:
    collection = chroma_client.get_collection("documents")
    print("✅ Connected to existing ChromaDB collection")
except:
    collection = chroma_client.create_collection("documents")
    print("✅ Created new ChromaDB collection")

# Global storage for TF-IDF vectorizer training
document_texts = []
vectorizer_fitted = False

# Pydantic models
class ChatRequest(BaseModel):
    message: str
    use_rag: bool = True

class ChatResponse(BaseModel):
    response: str
    sources: List[str] = []

class DocumentInfo(BaseModel):
    id: str
    filename: str
    content_preview: str

# Helper functions
def extract_text_from_pdf(file_content: bytes) -> str:
    """Extract text from PDF file"""
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_content))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading PDF: {str(e)}")

def extract_text_from_docx(file_content: bytes) -> str:
    """Extract text from DOCX file"""
    try:
        doc = docx.Document(io.BytesIO(file_content))
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        return text
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading DOCX: {str(e)}")

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    """Split text into overlapping chunks"""
    words = text.split()
    chunks = []
    
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i:i + chunk_size])
        if chunk.strip():
            chunks.append(chunk)
    
    return chunks

def query_ollama(prompt: str, context: str = "") -> str:
    """Query Ollama TinyLlama model or fallback to context-only response"""
    try:
        url = "http://localhost:11434/api/generate"
        
        if context:
            full_prompt = f"""Context: {context}

Question: {prompt}

Please answer the question based on the provided context. If the context doesn't contain relevant information, say so."""
        else:
            full_prompt = prompt
            
        payload = {
            "model": "tinyllama",
            "prompt": full_prompt,
            "stream": False
        }
        
        response = requests.post(url, json=payload, timeout=10)
        
        if response.status_code == 200:
            return response.json()["response"]
        else:
            # Fallback: return context-based response
            if context:
                return f"Based on the retrieved documents:\n\n{context}\n\nThis information is related to your question: '{prompt}'"
            else:
                return "Sorry, I couldn't generate a response. Ollama service is not available, but you can still upload documents and search through them."
            
    except requests.exceptions.ConnectionError:
        # Fallback: return context-based response
        if context:
            return f"🔍 **Retrieved Information:**\n\n{context}\n\n💡 **Note:** This is the relevant content found in your documents for the question: '{prompt}'. Ollama LLM is not available, but the document search is working!"
        else:
            return "⚠️ **Ollama not available** - You can still upload and search documents! The vector search will find relevant information even without the LLM."
    except Exception as e:
        if context:
            return f"📚 **Found in documents:**\n\n{context}\n\n(Note: LLM unavailable, showing raw search results)"
        else:
            return f"Error: {str(e)}"

# API Endpoints
@app.get("/")
async def root():
    return {"message": "Light RAG API is running!"}

@app.post("/upload", response_model=dict)
async def upload_document(file: UploadFile = File(...)):
    """Upload and process a document"""
    try:
        global document_texts, vectorizer, vectorizer_fitted
        
        # Read file content
        content = await file.read()
        
        # Extract text based on file type
        if file.filename.lower().endswith('.pdf'):
            text = extract_text_from_pdf(content)
        elif file.filename.lower().endswith('.docx'):
            text = extract_text_from_docx(content)
        elif file.filename.lower().endswith('.txt'):
            text = content.decode('utf-8')
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type. Please upload PDF, DOCX, or TXT files.")
        
        # Chunk the text
        chunks = chunk_text(text)
        
        if not chunks:
            raise HTTPException(status_code=400, detail="No text content found in the document.")
        
        # Add chunks to global document collection
        document_texts.extend(chunks)
        
        # Fit vectorizer only once with all documents, or refit if new documents
        vectorizer.fit(document_texts)
        vectorizer_fitted = True
        
        # Generate embeddings for current chunks
        embeddings = vectorizer.transform(chunks).toarray()
        
        # Ensure all embeddings have exactly EMBEDDING_DIM dimensions
        expected_dim = EMBEDDING_DIM
        actual_dim = embeddings.shape[1]
        
        if actual_dim != expected_dim:
            # Pad or truncate to match expected dimension
            if actual_dim < expected_dim:
                # Pad with zeros
                padding = np.zeros((embeddings.shape[0], expected_dim - actual_dim))
                embeddings = np.hstack([embeddings, padding])
            else:
                # Truncate to expected dimension
                embeddings = embeddings[:, :expected_dim]
        
        print(f"📊 Embeddings shape: {embeddings.shape} (expected: {expected_dim})")
        
        # Create unique IDs for chunks
        chunk_ids = [f"{file.filename}_{i}_{uuid.uuid4().hex[:8]}" for i in range(len(chunks))]
        
        # Store in ChromaDB
        collection.add(
            embeddings=embeddings.tolist(),
            documents=chunks,
            ids=chunk_ids,
            metadatas=[{"filename": file.filename, "chunk_index": i} for i in range(len(chunks))]
        )
        
        print(f"✅ Processed {file.filename}: {len(chunks)} chunks, {len(document_texts)} total documents")
        
        return {
            "message": f"Successfully uploaded and processed {file.filename}",
            "chunks_created": len(chunks),
            "filename": file.filename
        }
        
    except Exception as e:
        print(f"❌ Error processing {file.filename}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Chat endpoint with RAG functionality"""
    try:
        global document_texts, vectorizer, vectorizer_fitted
        
        if request.use_rag and len(document_texts) > 0 and vectorizer_fitted:
            # Generate embedding for the query using trained vectorizer
            query_embedding = vectorizer.transform([request.message]).toarray()
            
            # Ensure query embedding has correct dimension
            expected_dim = EMBEDDING_DIM
            actual_dim = query_embedding.shape[1]
            
            if actual_dim != expected_dim:
                if actual_dim < expected_dim:
                    # Pad with zeros
                    padding = np.zeros((1, expected_dim - actual_dim))
                    query_embedding = np.hstack([query_embedding, padding])
                else:
                    # Truncate to expected dimension
                    query_embedding = query_embedding[:, :expected_dim]
            
            print(f"🔍 Query embedding shape: {query_embedding.shape}")
            
            # Search for relevant documents
            results = collection.query(
                query_embeddings=query_embedding.tolist(),
                n_results=3
            )
            
            # Prepare context from retrieved documents
            context = ""
            sources = []
            
            if results['documents'] and results['documents'][0]:
                for i, doc in enumerate(results['documents'][0]):
                    context += f"Document {i+1}: {doc}\n\n"
                    if results['metadatas'] and results['metadatas'][0]:
                        filename = results['metadatas'][0][i].get('filename', 'Unknown')
                        if filename not in sources:
                            sources.append(filename)
            
            # Generate response with context
            response = query_ollama(request.message, context)
            
            return ChatResponse(response=response, sources=sources)
        else:
            # Generate response without RAG
            if len(document_texts) == 0:
                response = "⚠️ No documents uploaded yet. Please upload some documents first to enable RAG search!"
            else:
                response = query_ollama(request.message)
            return ChatResponse(response=response, sources=[])
            
    except Exception as e:
        print(f"❌ Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating response: {str(e)}")

@app.get("/documents", response_model=List[DocumentInfo])
async def get_documents():
    """Get list of uploaded documents"""
    try:
        # Get all documents from ChromaDB
        results = collection.get()
        
        # Group by filename
        documents = {}
        for i, metadata in enumerate(results['metadatas']):
            filename = metadata.get('filename', 'Unknown')
            if filename not in documents:
                # Get preview of first chunk
                preview = results['documents'][i][:200] + "..." if len(results['documents'][i]) > 200 else results['documents'][i]
                documents[filename] = DocumentInfo(
                    id=filename,
                    filename=filename,
                    content_preview=preview
                )
        
        return list(documents.values())
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving documents: {str(e)}")

@app.delete("/documents")
async def clear_documents():
    """Clear all documents from the vector store"""
    try:
        global collection, document_texts, vectorizer, vectorizer_fitted
        
        # Delete the collection and recreate it
        chroma_client.delete_collection("documents")
        collection = chroma_client.create_collection("documents")
        
        # Reset document storage and vectorizer
        document_texts = []
        vectorizer = TfidfVectorizer(max_features=EMBEDDING_DIM, stop_words='english')
        vectorizer_fitted = False
        
        print("✅ All documents and embeddings cleared")
        
        return {"message": "All documents cleared successfully"}
        
    except Exception as e:
        print(f"❌ Error clearing documents: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error clearing documents: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 