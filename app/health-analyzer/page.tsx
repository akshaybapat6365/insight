'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload } from '@/components/file-upload';
import Link from 'next/link';
import { HeartPulse, ArrowLeft, FileText, Upload, RefreshCw, Microscope, Bot } from 'lucide-react';
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
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-950 to-blue-950">
      {/* Header */}
      <header className="border-b border-blue-900/30 bg-gray-900/70 backdrop-blur-sm p-4">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
              <HeartPulse className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-lg font-medium text-blue-100">Health Insights AI</h1>
          </div>
          <div className="flex gap-3">
            <Link
              href="/"
              className="text-blue-300 hover:text-blue-100 text-sm flex items-center gap-1.5"
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
            <h1 className="text-3xl font-bold text-blue-100 mb-2">Lab Report Analyzer</h1>
            <p className="text-blue-300 max-w-2xl mx-auto">
              Upload your lab report or medical test results to get a detailed analysis and insights about what your results mean for your health.
            </p>
          </div>
          
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Upload */}
            <div>
              <div className="bg-gray-900/50 border border-blue-900/30 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-blue-100 mb-4 flex items-center">
                  <Microscope className="h-5 w-5 text-blue-400 mr-2" />
                  Upload Lab Report
                </h2>
                
                {/* File Upload Section */}
                <div className="mb-6">
                  <div 
                    className={`border-2 border-dashed rounded-lg p-6 text-center ${
                      file ? 'border-green-500/50 bg-green-900/10' : 'border-blue-800/50 bg-blue-900/10'
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
                        <FileText className="h-10 w-10 text-green-400 mb-2" />
                        <p className="text-green-300 font-medium">{fileName}</p>
                        <p className="text-green-400/70 text-sm mt-1">
                          {fileType} • {(fileSize / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <button
                          className="mt-3 text-sm text-blue-400 hover:text-blue-300"
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
                        <Upload className="h-10 w-10 text-blue-400 mb-2" />
                        <p className="text-blue-300 font-medium">Drop your lab report or click to browse</p>
                        <p className="text-blue-400/70 text-sm mt-1">
                          PDF, JPG, or PNG (Max 20MB)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Optional Message */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-blue-200 mb-2">
                    Additional Context (Optional)
                  </label>
                  <Textarea
                    placeholder="Add any symptoms or specific questions you have about your results..."
                    className="w-full bg-gray-800/70 border-gray-700 focus:border-blue-500 text-white"
                    rows={4}
                    value={userMessage}
                    onChange={(e) => setUserMessage(e.target.value)}
                    disabled={isUploading}
                  />
                </div>
                
                {/* Error Message */}
                {error && (
                  <div className="mb-6 p-3 bg-red-900/30 border border-red-800 rounded-md text-red-200 text-sm">
                    {error}
                  </div>
                )}
                
                {/* Upload Progress */}
                {uploadProgress !== null && (
                  <div className="mb-6">
                    <div className="flex justify-between text-sm text-blue-300 mb-1">
                      <span>Analyzing Lab Report</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-blue-400/70 mt-1">
                      {uploadProgress < 100 
                        ? "This may take a moment as we analyze your results in detail..." 
                        : "Analysis complete!"}
                    </p>
                  </div>
                )}
                
                {/* Submit Button */}
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium"
                  onClick={analyzeLabReport}
                  disabled={!file || isUploading}
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    'Analyze Lab Report'
                  )}
                </Button>
              </div>
            </div>
            
            {/* Right Column - Results */}
            <div>
              <div className="bg-gray-900/50 border border-blue-900/30 rounded-lg p-6 h-full">
                <h2 className="text-xl font-semibold text-blue-100 mb-4 flex items-center">
                  <Bot className="h-5 w-5 text-blue-400 mr-2" />
                  Analysis Results
                </h2>
                
                {analysis ? (
                  <div className="prose prose-invert prose-blue prose-sm max-w-none">
                    <ReactMarkdown>{analysis}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-center text-blue-300/70">
                    <Microscope className="h-12 w-12 text-blue-800/50 mb-3" />
                    <p className="text-lg font-medium text-blue-300">
                      Your lab analysis will appear here
                    </p>
                    <p className="text-sm max-w-md mt-2">
                      Upload your lab report and click "Analyze" to get personalized insights and explanations about your health data.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Instructions/Disclaimer */}
          <div className="mt-8 p-4 bg-blue-950/30 border border-blue-900/30 rounded-lg text-blue-300/90 text-sm">
            <h3 className="font-medium text-blue-200 mb-2">Important Notes:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>This analysis is provided for informational purposes only and is not medical advice.</li>
              <li>Always consult with a healthcare professional about your lab results and health concerns.</li>
              <li>Your data is processed securely and not stored permanently.</li>
              <li>For best results, upload clear and complete lab reports in PDF format.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 