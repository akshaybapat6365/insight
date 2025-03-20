'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload } from '@/components/file-upload';
import { ProgressBar } from '@/components/ui/progress-bar';
import Link from 'next/link';
import { HeartPulse, ArrowLeft, FileText, Upload, RefreshCw, Microscope, Bot, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// File validation and size constants
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const MIN_FILE_SIZE = 100; // 100 bytes - reject empty files
const VALID_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
const VALID_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png'];

/**
 * Format file size into human-readable format
 */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

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
  const [analysisState, setAnalysisState] = useState<'idle' | 'loading' | 'success' | 'error' | 'partial'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // References to store intervals and controllers for cleanup
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const statusIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  
  const [isMounted, setIsMounted] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  
  // Cleanup function for intervals and controllers
  useEffect(() => {
    setIsMounted(true);
    
    // Cleanup function to run on unmount
    return () => {
      setIsMounted(false);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
        statusIntervalRef.current = null;
      }
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
    };
  }, []);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    // Reset error message when user selects a new file
    setError('');
    
    // Get file extension
    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
    
    // Some browsers might report different MIME types for the same file type
    // Let's normalize the MIME type checking
    const isPdf = selectedFile.type.includes('pdf') || fileExtension === 'pdf';
    const isJpeg = selectedFile.type.includes('jpeg') || selectedFile.type.includes('jpg') || 
                  ['jpg', 'jpeg'].includes(fileExtension || '');
    const isPng = selectedFile.type.includes('png') || fileExtension === 'png';
    
    // Check if the file is one of the valid types
    const isValidType = isPdf || isJpeg || isPng;
    
    if (!isValidType) {
      // Provide specific error messages based on the issue
      if (!fileExtension) {
        if (isMounted) {
          setError('File has no extension. Please upload a PDF or image file (.pdf, .jpg, .png).');
        }
      } else if (!VALID_EXTENSIONS.includes(fileExtension)) {
        if (isMounted) {
          setError(`File extension ".${fileExtension}" is not supported. Allowed types: PDF, JPG, PNG.`);
        }
      } else {
        if (isMounted) {
          setError(`Unsupported file type: ${selectedFile.type}. Please upload a PDF or image of your lab report.`);
        }
      }
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    
    // Check for minimum file size
    if (selectedFile.size <= MIN_FILE_SIZE) {
      if (isMounted) {
        setError(`File is too small (${formatFileSize(selectedFile.size)}). The file appears to be empty or invalid.`);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    
    // Check file size (20MB max)
    if (selectedFile.size > MAX_FILE_SIZE) {
      if (isMounted) {
        setError(`File too large (${formatFileSize(selectedFile.size)}). Maximum size is ${formatFileSize(MAX_FILE_SIZE)}.`);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    
    if (isMounted) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setFileType(selectedFile.type);
      setFileSize(selectedFile.size);
      setError('');
    }
  };
  
  const resetForm = () => {
    // Clear any pending intervals or controllers when resetting the form
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    
    if (statusIntervalRef.current) {
      clearInterval(statusIntervalRef.current);
      statusIntervalRef.current = null;
    }
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    setFile(null);
    setFileName('');
    setFileType('');
    setFileSize(0);
    setUserMessage('');
    setError('');
    setAnalysis('');
    setUploadProgress(null);
    setAnalysisState('idle');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const analyzeLabReport = async () => {
    if (!file) {
      if (isMounted) {
        setError('Please select a file to analyze.');
      }
      return;
    }
    
    if (isMounted) {
      setIsUploading(true);
      setError('');
      setUploadProgress(0);
      setAnalysisState('loading');
      setAnalysis('');
    }
    
    // Create and store the abort controller in ref for cleanup
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    // Set a timeout to abort operation if it takes too long
    const timeoutId = setTimeout(() => {
      if (abortController && !abortController.signal.aborted) {
        abortController.abort();
        if (isMounted) {
          setError('Operation timed out. The server took too long to respond.');
          setAnalysisState('error');
          setIsUploading(false);
        }
      }
    }, 120000); // 2 minutes timeout
    
    // Store the timeout ID in the ref for cleanup
    timeoutIdRef.current = timeoutId;
    
    try {
      // Prepare form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('message', userMessage || 'Please analyze this lab report and explain what it means for my health.');
      
      // Check if file is large enough to warrant background processing
      const isLargeFile = file.size > 5 * 1024 * 1024; // 5MB threshold
      
      if (isLargeFile) {
        // Initialize background processing
        const initResponse = await fetch('/api/analyze-labs-init', {
          method: 'POST',
          body: formData,
          signal: abortController.signal
        });
        
        if (!initResponse.ok) {
          const errorData = await initResponse.json();
          throw new Error(errorData.error || `Server error: ${initResponse.status}`);
        }
        
        const initData = await initResponse.json();
        const { jobId } = initData;
        
        // Set up polling for job status
        const statusInterval = setInterval(async () => {
          try {
            if (!isMounted) {
              if (statusIntervalRef.current) {
                clearInterval(statusIntervalRef.current);
                statusIntervalRef.current = null;
              }
              return;
            }
            
            const statusResponse = await fetch(`/api/analyze-labs-status?id=${jobId}`, {
              signal: abortController.signal
            });
            
            if (!statusResponse.ok) {
              const errorData = await statusResponse.json();
              throw new Error(errorData.error || `Status check failed: ${statusResponse.status}`);
            }
            
            const status = await statusResponse.json();
            
            // Only update if component is still mounted
            if (isMounted) {
              // Update progress
              setUploadProgress(status.progress || 90);
              
              // Handle different job states
              switch (status.status) {
                case 'completed':
                  if (statusIntervalRef.current) {
                    clearInterval(statusIntervalRef.current);
                    statusIntervalRef.current = null;
                  }
                  setAnalysis(status.analysis);
                  setAnalysisState('success');
                  setUploadProgress(100);
                  break;
                
                case 'failed':
                  if (statusIntervalRef.current) {
                    clearInterval(statusIntervalRef.current);
                    statusIntervalRef.current = null;
                  }
                  throw new Error(status.error || 'Analysis failed');
                
                case 'processing':
                  // Continue polling
                  break;
                
                default:
                  // Handle other states if needed
                  break;
              }
            }
          } catch (error: any) {
            console.error('Error checking job status:', error);
            if (statusIntervalRef.current) {
              clearInterval(statusIntervalRef.current);
              statusIntervalRef.current = null;
            }
            throw error;
          }
        }, 2000);
        
        // Store the interval in ref for cleanup
        statusIntervalRef.current = statusInterval;
      } else {
        // Use direct processing for smaller files
        // Check for real progress tracking support
        const supportsProgressTracking = window.XMLHttpRequest && 'upload' in XMLHttpRequest.prototype;
        
        if (supportsProgressTracking) {
          // Use XHR for real progress tracking
          const xhr = new XMLHttpRequest();
          
          // Create a promise to handle the XHR response
          const response = await new Promise<any>((resolve, reject) => {
            // Track actual upload progress
            xhr.upload.addEventListener('progress', (event) => {
              if (event.lengthComputable) {
                // Keep progress at max 90% until server processing completes
                const progress = Math.round((event.loaded / event.total) * 90);
                setUploadProgress(progress);
              }
            });
            
            // Handle completion
            xhr.addEventListener('load', () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                // Set to 100% when finished
                setUploadProgress(100);
                try {
                  const data = JSON.parse(xhr.responseText);
                  resolve(data);
                } catch (error) {
                  reject(new Error('Error parsing server response'));
                }
              } else {
                reject(new Error(`Server error: ${xhr.status}`));
              }
            });
            
            // Handle errors
            xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
            xhr.addEventListener('abort', () => reject(new Error('Upload was canceled')));
            
            // Link abort controller
            abortController.signal.addEventListener('abort', () => xhr.abort());
            
            // Send the request
            xhr.open('POST', '/api/analyze-labs');
            xhr.send(formData);
          });
          
          // Handle the response data
          if (isMounted) {
            if (response.success && response.analysis) {
              setAnalysis(response.analysis);
              setAnalysisState('success');
            } else if (response.partial && response.analysis) {
              setAnalysis(response.analysis);
              setAnalysisState('partial');
            } else if (response.error) {
              throw new Error(response.error);
            } else {
              throw new Error('No analysis was returned from the server');
            }
          }
        } else {
          // Fallback to simulated progress for better UX
          progressIntervalRef.current = setInterval(() => {
            if (isMounted) {
              setUploadProgress(prev => {
                if (prev === null) return 10;
                if (prev >= 90) return 90; // Cap at 90% until we get the actual result
                return prev + Math.random() * 3;
              });
            } else if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current);
              progressIntervalRef.current = null;
            }
          }, 1000);
          
          try {
            // Standard fetch request
            const response = await fetch('/api/analyze-labs', {
              method: 'POST',
              body: formData,
              signal: abortController.signal
            });
            
            // Clear simulation interval
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current);
              progressIntervalRef.current = null;
            }
            
            if (isMounted) {
              setUploadProgress(100);
            }
            
            if (!response.ok) {
              // Try to get detailed error from response
              try {
                const errorData = await response.json();
                throw new Error(errorData.error || `Server error: ${response.status}`);
              } catch (jsonError) {
                // If we can't parse JSON, use generic error
                throw new Error(`Server error: ${response.status}`);
              }
            }
            
            const data = await response.json();
            if (data.success && data.analysis) {
              if (isMounted) {
                setAnalysis(data.analysis);
                setAnalysisState('success');
              }
            } else if (data.partial && data.analysis) {
              if (isMounted) {
                setAnalysis(data.analysis);
                setAnalysisState('partial');
              }
            } else if (data.error) {
              throw new Error(data.error);
            } else {
              throw new Error('No analysis was returned from the server');
            }
          } catch (fetchError: any) {
            // Make sure to clear interval if fetch fails
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current);
              progressIntervalRef.current = null;
            }
            throw fetchError;
          }
        }
      }
    } catch (err: any) {
      console.error('Error analyzing lab report:', err);
      
      // Format the error message
      let errorMessage = 'Unknown error occurred';
      
      if (err.name === 'AbortError') {
        errorMessage = 'Operation was aborted. This could be due to a timeout or server issue.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      // Only update state if component is still mounted
      if (isMounted) {
        setError(`Error: ${errorMessage}`);
        setAnalysisState('error');
      }
    } finally {
      // Clear the timeout
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      
      // Clean up resources in all cases
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
        statusIntervalRef.current = null;
      }
      
      // Only update if component is still mounted
      if (isMounted) {
        setIsUploading(false);
      }
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black p-4 sticky top-0 z-10">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-medium text-white">Health Insights AI</h1>
          </div>
          <div>
            <Link
              href="/"
              className="text-gray-400 hover:text-white flex items-center gap-1.5 text-sm"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </header>
      
      {/* Health Disclaimer Banner */}
      <div className="bg-blue-900/20 border-b border-blue-800/40 py-2 px-4">
        <div className="container">
          <p className="text-xs text-blue-200 text-center">
            HEALTH DISCLAIMER: This tool provides educational information only and is not a substitute for professional medical advice. 
            Always consult with healthcare professionals for interpreting health data.
          </p>
        </div>
      </div>
      
      <main className="flex-1 container py-6 md:py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Health Report Analyzer</h1>
          <p className="text-gray-400 mb-6 md:mb-8">Upload your lab report or medical document for AI-powered analysis.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* Upload Section */}
            <div className="order-1 md:order-none">
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 md:p-6 mb-4">
                <div className="mb-5 flex items-center gap-2">
                  <Microscope className="h-5 w-5 text-blue-400" />
                  <h2 className="text-xl font-semibold text-white">
                    Upload Lab Report
                  </h2>
                </div>
                
                {/* File upload */}
                <div 
                  className={`mb-5 border-2 border-dashed p-4 md:p-8 rounded-lg text-center ${
                    error ? 'border-red-500 bg-red-900/10' : 
                    isDragging ? 'border-blue-500 bg-blue-900/10' : 
                    'border-gray-700 bg-gray-800/20 hover:border-gray-600 focus-within:border-blue-500'
                  }`}
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                  onKeyDown={(e) => {
                    // Allow keyboard users to activate with Enter or Space
                    if ((e.key === 'Enter' || e.key === ' ') && !isUploading) {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!isDragging) setIsDragging(true);
                  }}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragging(false);
                    if (isUploading) return;

                    const files = e.dataTransfer?.files;
                    if (files && files.length > 0) {
                      // Get the file from the drop event
                      const fileFromDrop = files[0];
                      
                      // Set the file directly rather than trying to reuse the handleFileChange function
                      // This avoids the need for complex event synthesis
                      
                      // Reset error message when user selects a new file
                      setError('');
                      
                      // Get file extension
                      const fileExtension = fileFromDrop.name.split('.').pop()?.toLowerCase();
                      
                      // Validate the file in the same way as handleFileChange
                      const isPdf = fileFromDrop.type.includes('pdf') || fileExtension === 'pdf';
                      const isJpeg = fileFromDrop.type.includes('jpeg') || fileFromDrop.type.includes('jpg') || 
                                    ['jpg', 'jpeg'].includes(fileExtension || '');
                      const isPng = fileFromDrop.type.includes('png') || fileExtension === 'png';
                      
                      const isValidType = isPdf || isJpeg || isPng;
                      
                      if (!isValidType) {
                        if (!fileExtension) {
                          if (isMounted) {
                            setError('File has no extension. Please upload a PDF or image file (.pdf, .jpg, .png).');
                          }
                        } else if (!VALID_EXTENSIONS.includes(fileExtension)) {
                          if (isMounted) {
                            setError(`File extension ".${fileExtension}" is not supported. Allowed types: PDF, JPG, PNG.`);
                          }
                        } else {
                          if (isMounted) {
                            setError(`Unsupported file type: ${fileFromDrop.type}. Please upload a PDF or image of your lab report.`);
                          }
                        }
                        return;
                      }
                      
                      // Check for minimum file size
                      if (fileFromDrop.size <= MIN_FILE_SIZE) {
                        if (isMounted) {
                          setError(`File is too small (${formatFileSize(fileFromDrop.size)}). The file appears to be empty or invalid.`);
                        }
                        return;
                      }
                      
                      // Check file size (20MB max)
                      if (fileFromDrop.size > MAX_FILE_SIZE) {
                        if (isMounted) {
                          setError(`File too large (${formatFileSize(fileFromDrop.size)}). Maximum size is ${formatFileSize(MAX_FILE_SIZE)}.`);
                        }
                        return;
                      }
                      
                      // Set the file information
                      if (isMounted) {
                        setFile(fileFromDrop);
                        setFileName(fileFromDrop.name);
                        setFileType(fileFromDrop.type);
                        setFileSize(fileFromDrop.size);
                      }
                    }
                  }}
                  role="button"
                  tabIndex={isUploading ? -1 : 0}
                  aria-label="Choose file or drop file here"
                >
                  <input
                    ref={fileInputRef}
                    id="lab-report-upload"
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                    disabled={isUploading}
                    aria-label="Upload lab report file"
                  />
                  
                  {file ? (
                    <div className="flex flex-col items-center">
                      <FileText className="h-10 w-10 text-gray-400 mb-2" />
                      <p className="text-gray-300 font-medium">{fileName}</p>
                      <p className="text-gray-500 text-sm mt-1">
                        {fileType} • {formatFileSize(fileSize)}
                      </p>
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
                
                {/* File reset button - moved outside the interactive div */}
                {file && (
                  <div className="mb-5 text-center">
                    <button
                      type="button"
                      className="text-sm text-gray-400 hover:text-gray-300"
                      onClick={resetForm}
                      aria-label="Choose a different file"
                    >
                      Choose a different file
                    </button>
                  </div>
                )}
                
                {/* Error message with proper a11y */}
                {error && (
                  <div 
                    className="mb-5 px-4 py-3 rounded bg-red-900/20 border border-red-800 text-red-300"
                    role="alert"
                    aria-live="assertive"
                    id="file-error"
                  >
                    <div className="flex gap-2">
                      <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <p>{error}</p>
                    </div>
                  </div>
                )}
                
                {/* Optional message */}
                <div className="mb-5">
                  <label 
                    htmlFor="user-notes" 
                    className="block text-gray-300 text-sm font-medium mb-2"
                  >
                    Additional Notes (Optional)
                  </label>
                  <Textarea
                    id="user-notes"
                    value={userMessage}
                    onChange={(e) => setUserMessage(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="Anything specific you'd like to know about this report?"
                    rows={3}
                  />
                </div>
                
                {/* Analyze button */}
                <Button
                  onClick={analyzeLabReport}
                  disabled={!file || isUploading}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2"
                  aria-label={isUploading ? "Analyzing report..." : "Analyze report"}
                >
                  {isUploading ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Analyzing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Microscope className="h-4 w-4" />
                      Analyze Report
                    </span>
                  )}
                </Button>
                
                {/* Progress bar */}
                {uploadProgress !== null && (
                  <ProgressBar progress={uploadProgress} className="mt-4" />
                )}
              </div>
            </div>
            
            {/* Results Section */}
            <div className="order-2 md:order-none">
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 md:p-6 h-full">
                <div className="mb-5 flex items-center gap-2">
                  <Bot className="h-5 w-5 text-blue-400" />
                  <h2 className="text-xl font-semibold text-white">
                    Analysis Results
                  </h2>
                </div>
                
                {analysisState === 'loading' && (
                  <div 
                    className="flex flex-col items-center justify-center py-8 text-gray-400"
                    aria-live="polite"
                  >
                    <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mb-4" aria-hidden="true" />
                    <p className="mb-2">Processing your lab report...</p>
                    <p className="text-sm text-gray-500">This may take a minute, especially for large files.</p>
                  </div>
                )}
                
                {analysisState === 'error' && (
                  <div 
                    className="text-center py-8 text-gray-400"
                    role="alert"
                    aria-live="assertive"
                  >
                    <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" aria-hidden="true" />
                    <p className="mb-2">Analysis failed</p>
                    <p className="text-sm text-red-400">{error || "We couldn't analyze this document. Please try again or use a different file."}</p>
                  </div>
                )}
                
                {analysisState === 'partial' && analysis && (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <div 
                      className="bg-yellow-900/20 border border-yellow-800/50 px-4 py-3 rounded mb-4"
                      role="alert"
                    >
                      <p className="text-yellow-300 text-sm flex items-center">
                        <AlertCircle className="h-4 w-4 mr-2" aria-hidden="true" />
                        We could only extract partial information from your document.
                      </p>
                    </div>
                    <ReactMarkdown>
                      {analysis}
                    </ReactMarkdown>
                    
                    <p className="mt-4 text-xs text-gray-500 italic">
                      This analysis is for educational purposes only and not a substitute for
                      professional medical advice.
                    </p>
                    
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
                )}
                
                {analysisState === 'success' && analysis && (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown>
                      {analysis}
                    </ReactMarkdown>
                    
                    <p className="mt-4 text-xs text-gray-500 italic">
                      This analysis is for educational purposes only and not a substitute for
                      professional medical advice.
                    </p>
                    
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
                )}
                
                {analysisState === 'idle' && (
                  <div className="text-center py-8 text-gray-400">
                    <FileText className="h-12 w-12 mx-auto text-gray-600 mb-4" />
                    <p className="mb-2">No analysis yet</p>
                    <p className="text-sm">Upload a lab report and click "Analyze Report" to get insights</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 