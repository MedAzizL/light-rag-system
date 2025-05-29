'use client'

import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { Upload, Send, FileText, Trash2, MessageCircle, Bot, User, AlertCircle } from 'lucide-react'

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  sources?: string[]
  timestamp: Date
}

interface Document {
  id: string
  filename: string
  content_preview: string
}

const API_BASE_URL = 'http://localhost:8000'

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [useRAG, setUseRAG] = useState(true)
  const [uploadStatus, setUploadStatus] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchDocuments()
    // Add welcome message
    setMessages([{
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m your Light RAG assistant. Upload some documents and I\'ll help you find information from them. You can also chat with me directly without documents.',
      timestamp: new Date()
    }])
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchDocuments = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/documents`)
      setDocuments(response.data)
    } catch (error) {
      console.error('Error fetching documents:', error)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadStatus('Uploading...')
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      
      setUploadStatus(`✅ ${response.data.message}`)
      fetchDocuments()
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      setTimeout(() => setUploadStatus(''), 3000)
    } catch (error: any) {
      setUploadStatus(`❌ Error: ${error.response?.data?.detail || 'Upload failed'}`)
      setTimeout(() => setUploadStatus(''), 5000)
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await axios.post(`${API_BASE_URL}/chat`, {
        message: inputMessage,
        use_rag: useRAG
      })

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.data.response,
        sources: response.data.sources,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `Error: ${error.response?.data?.detail || 'Failed to get response. Make sure the backend is running and Ollama is available.'}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const clearDocuments = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/documents`)
      setDocuments([])
      setUploadStatus('✅ All documents cleared')
      setTimeout(() => setUploadStatus(''), 3000)
    } catch (error) {
      setUploadStatus('❌ Error clearing documents')
      setTimeout(() => setUploadStatus(''), 3000)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            Light RAG Assistant
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Powered by Ollama + Mistral, ChromaDB, and Hugging Face
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Document Management Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white flex items-center">
                <FileText className="mr-2" size={20} />
                Documents
              </h2>
              
              {/* Upload Section */}
              <div className="mb-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="flex items-center justify-center w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                >
                  <Upload className="mr-2" size={20} />
                  Upload Document
                </label>
                {uploadStatus && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {uploadStatus}
                  </p>
                )}
              </div>

              {/* RAG Toggle */}
              <div className="mb-6">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={useRAG}
                    onChange={(e) => setUseRAG(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Use RAG (Document Search)
                  </span>
                </label>
              </div>

              {/* Document List */}
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <p className="font-medium text-sm text-gray-800 dark:text-white">
                      {doc.filename}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {doc.content_preview.substring(0, 100)}...
                    </p>
                  </div>
                ))}
              </div>

              {documents.length > 0 && (
                <button
                  onClick={clearDocuments}
                  className="mt-4 w-full flex items-center justify-center p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  <Trash2 className="mr-2" size={16} />
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg h-[600px] flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center">
                  <MessageCircle className="mr-2" size={20} />
                  Chat
                  {useRAG && documents.length > 0 && (
                    <span className="ml-2 px-2 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 text-xs rounded-full">
                      RAG Enabled
                    </span>
                  )}
                </h2>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`chat-message flex ${
                      message.type === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white'
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        {message.type === 'user' ? (
                          <User size={16} className="mt-1 flex-shrink-0" />
                        ) : (
                          <Bot size={16} className="mt-1 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className="whitespace-pre-wrap">{message.content}</p>
                          {message.sources && message.sources.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600">
                              <p className="text-xs opacity-75">Sources:</p>
                              <ul className="text-xs opacity-75">
                                {message.sources.map((source, index) => (
                                  <li key={index}>• {source}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Bot size={16} />
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex space-x-2">
                  <textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything..."
                    className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    rows={1}
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={isLoading || !inputMessage.trim()}
                    className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Frontend: Next.js
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
              Backend: FastAPI
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
              LLM: Ollama + Mistral
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
              Vector DB: ChromaDB
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
