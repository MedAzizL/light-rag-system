@echo off
echo ========================================
echo Starting Light RAG System
echo ========================================
echo.

echo Starting services in separate windows...
echo.

echo [1/3] Starting Ollama with Mistral...
start "Ollama Mistral" cmd /k "ollama run mistral"

echo [2/3] Starting FastAPI Backend...
start "Light RAG Backend" cmd /k "cd backend && venv\Scripts\activate && python main.py"

echo [3/3] Starting Next.js Frontend...
start "Light RAG Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo All services starting...
echo.
echo Wait a moment for all services to start, then:
echo Open http://localhost:3000 in your browser
echo ========================================
echo.
echo Press any key to exit this window...
pause >nul 