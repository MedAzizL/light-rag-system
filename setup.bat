@echo off
echo ========================================
echo Light RAG Setup Script for Windows
echo ========================================
echo.

echo [1/4] Setting up Python backend...
cd backend
python -m venv venv
call venv\Scripts\activate.bat
pip install -r requirements.txt
cd ..

echo.
echo [2/4] Setting up Node.js frontend...
cd frontend
npm install
cd ..

echo.
echo [3/4] Checking Ollama installation...
ollama --version >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Ollama not found! Please install Ollama first:
    echo https://ollama.ai/download
    echo.
    echo After installing Ollama, run: ollama pull mistral
) else (
    echo Ollama found! Pulling Mistral model...
    ollama pull mistral
)

echo.
echo [4/4] Setup complete!
echo.
echo ========================================
echo Next steps:
echo 1. Start Ollama: ollama run mistral
echo 2. Start backend: cd backend && venv\Scripts\activate && python main.py
echo 3. Start frontend: cd frontend && npm run dev
echo 4. Open http://localhost:3000
echo ========================================
pause 