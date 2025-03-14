'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload } from '@/components/file-upload';
import Link from 'next/link';
import { HeartPulse, ArrowLeft, FileText, Upload, RefreshCw, Microscope, Bot, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function HealthAnalyzer() {
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [userMessage, setUserMessage] = useState('');
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    // Validate file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(selectedFile.type)) {
      setError(`Unsupported file type: ${selectedFile.type}. Please upload a PDF or image of your lab report.`);
      return;
    }
    
    // Check file size (20MB max)
    const MAX_SIZE = 20 * 1024 * 1024;
    if (selectedFile.size > MAX_SIZE) {
      setError(`File too large (${(selectedFile.size / (1024 * 1024)).toFixed(2)}MB). Maximum size is 20MB.`);
      return;
    }
    
    setFile(selectedFile);
    setFileName(selectedFile.name);
    setFileType(selectedFile.type);
    setFileSize(selectedFile.size);
    setError('');
  };
  
  const resetForm = () => {
    setFile(null);
    setFileName('');
    setFileType('');
    setFileSize(0);
    setUserMessage('');
    setError('');
    setAnalysis('');
    setUploadProgress(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const analyzeLabReport = async () => {
    if (!file) {
      setError('Please select a file to analyze.');
      return;
    }
    
    setIsUploading(true);
    setError('');
    setUploadProgress(0);
    
    // Create progress simulation
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev === null) return 10;
        return prev < 90 ? prev + 5 : prev;
      });
    }, 500);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('message', userMessage || 'Please analyze this lab report and explain what it means for my health.');
      
      const response = await fetch('/api/analyze-labs', {
        method: 'POST',
        body: formData,
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success && data.analysis) {
        setAnalysis(data.analysis);
      } else {
        throw new Error('No analysis was returned from the server.');
      }
    } catch (err: any) {
      console.error('Error analyzing lab report:', err);
      setError(`Error: ${err.message || 'Unknown error occurred'}`);
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black p-4">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-medium text-white">Health Insights AI</h1>
          </div>
          <div>
            <Link
              href="/"
              className="text-gray-400 hover:text-white text-sm flex items-center gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </header>
      
      {/* Content */}
      <div className="flex-1 overflow-auto p-4 container py-8">
        <div className="max-w-4xl mx-auto">
          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Lab Report Analyzer</h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Upload your lab report or medical test results to get a detailed analysis and insights about what your results mean for your health.
            </p>
          </div>
          
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Upload */}
            <div>
              <div className="bg-black border border-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <Microscope className="h-5 w-5 text-gray-400 mr-2" />
                  Upload Lab Report
                </h2>
                
                {/* File Upload Section */}
                <div className="mb-6">
                  <div 
                    className={`border-2 border-dashed rounded-lg p-6 text-center ${
                      file ? 'border-gray-700 bg-gray-900/20' : 'border-gray-800 bg-gray-900/10'
                    } transition-colors`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileChange}
                      accept=".pdf,.jpg,.jpeg,.png"
                      disabled={isUploading}
                    />
                    
                    {file ? (
                      <div className="flex flex-col items-center">
                        <FileText className="h-10 w-10 text-gray-400 mb-2" />
                        <p className="text-gray-300 font-medium">{fileName}</p>
                        <p className="text-gray-500 text-sm mt-1">
                          {fileType} • {(fileSize / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <button
                          className="mt-3 text-sm text-gray-400 hover:text-gray-300"
                          onClick={(e) => {
                            e.stopPropagation();
                            resetForm();
                          }}
                        >
                          Choose a different file
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="h-10 w-10 text-gray-400 mb-2" />
                        <p className="text-gray-300 font-medium">Drop your lab report or click to browse</p>
                        <p className="text-gray-500 text-sm mt-1">
                          PDF, JPG, or PNG (Max 20MB)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Optional message */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Additional context (optional)
                  </label>
                  <Textarea
                    placeholder="Add any additional information about your health situation or specific questions about the lab report..."
                    value={userMessage}
                    onChange={(e) => setUserMessage(e.target.value)}
                    className="w-full bg-gray-900 border-gray-800 text-gray-300 placeholder:text-gray-600"
                    rows={3}
                  />
                </div>
                
                {/* Action buttons */}
                <Button
                  onClick={analyzeLabReport}
                  disabled={isUploading || !file}
                  className="w-full bg-gray-800 hover:bg-gray-700 text-white"
                >
                  {isUploading ? (
                    <div className="flex items-center">
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </div>
                  ) : (
                    'Analyze Report'
                  )}
                </Button>
                
                {/* Upload progress */}
                {uploadProgress !== null && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Processing</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gray-600 transition-all duration-300 ease-out"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {/* Errors */}
                {error && (
                  <div className="mt-4 p-3 bg-gray-900 border border-red-900/50 rounded text-sm text-gray-300">
                    <div className="flex gap-2 items-start">
                      <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Error</p>
                        <p>{error}</p>
                      </div>
                    </div>
                  </div>
                )}
                
              </div>
            </div>
            
            {/* Right Column - Analysis Results */}
            <div>
              {analysis ? (
                <div className="bg-black border border-gray-800 rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                    <Bot className="h-5 w-5 text-gray-400 mr-2" />
                    Analysis Results
                  </h2>
                  
                  <div className="prose prose-invert prose-gray prose-sm max-w-none">
                    <ReactMarkdown>
                      {analysis}
                    </ReactMarkdown>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-gray-800">
                    <Button
                      onClick={resetForm}
                      variant="outline"
                      className="w-full border-gray-800 bg-gray-900 hover:bg-gray-800 text-gray-300"
                    >
                      Start New Analysis
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-black border border-gray-800 rounded-lg p-6 h-full flex items-center justify-center text-center">
                  <div className="max-w-xs mx-auto">
                    <div className="mb-4 h-16 w-16 mx-auto rounded-full bg-gray-900 flex items-center justify-center">
                      <Microscope className="h-8 w-8 text-gray-500" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">Analysis Results</h3>
                    <p className="text-gray-400 text-sm">
                      Upload a lab report and click "Analyze Report" to get a detailed analysis of your health data.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 