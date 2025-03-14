'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, FileText, AlertCircle, FileType, FileCheck, RefreshCw } from 'lucide-react'

export function FileUpload({ onFileProcessed }: { onFileProcessed: (text: string) => void }) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [fileInfo, setFileInfo] = useState<{name: string, type: string, size: number} | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Check file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv']
    if (!validTypes.includes(file.type)) {
      setError(`Unsupported file type: ${file.type}. Please upload a PDF, JPEG, PNG, or Excel/CSV file`)
      return
    }

    // Check file size (10MB max)
    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
    if (file.size > MAX_FILE_SIZE) {
      setError(`File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum size is 10MB.`)
      return
    }

    // Show file info for debugging
    setFileInfo({
      name: file.name,
      type: file.type,
      size: file.size
    })
    
    setIsUploading(true)
    setError('')
    setUploadProgress(0)
    
    try {
      console.log(`Starting upload of ${file.name} (${file.type}, ${file.size / 1024} KB)`)
      
      // Additional diagnostic for PDF files
      if (file.type === 'application/pdf') {
        console.log('Processing PDF file. This may take longer depending on file size and complexity.')
      }
      
      const formData = new FormData()
      formData.append('file', file)
      
      // Simulate upload progress (real progress monitoring would require custom XMLHttpRequest)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev === null) return 0;
          // Only advance progress to 90% - the last 10% is reserved for server processing
          return prev < 90 ? prev + 10 : prev;
        });
      }, 300);
      
      console.log('Sending request to process-file API...')
      
      try {
        const response = await fetch('/api/process-file', {
          method: 'POST',
          body: formData
        })
        
        // Clear the progress interval
        clearInterval(progressInterval);
        
        console.log('Response status:', response.status)
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => null)
          console.error('API error response:', errorData)
          
          // Format detailed error message
          let errorMessage = `Error processing file (${response.status}): `;
          
          if (errorData?.error) {
            errorMessage += errorData.error;
          } else if (response.status === 413) {
            errorMessage += 'File too large for server. Please try a smaller file.';
          } else if (response.status === 429) {
            errorMessage += 'Too many requests. Please try again later.';
          } else if (response.status >= 500) {
            errorMessage += 'Server error. The system might be temporarily unavailable.';
          } else {
            errorMessage += 'Unknown error';
          }
          
          // Include additional details if available
          if (errorData?.errorDetails) {
            console.error('Detailed error:', errorData.errorDetails);
          }
          
          throw new Error(errorMessage);
        }
        
        // Process successful response
        setUploadProgress(100);
        const data = await response.json()
        console.log('File processed successfully')
        
        if (onFileProcessed && data.text) {
          onFileProcessed(data.text)
        } else {
          throw new Error('No text was extracted from the file. Please try a different file.')
        }
      } catch (fetchError: any) {
        // Handle fetch or response parsing errors
        console.error('Fetch error:', fetchError)
        setError(fetchError.message || 'Failed to communicate with the server')
        clearInterval(progressInterval)
        setUploadProgress(null)
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      setError(error.message || 'An unknown error occurred during file upload')
    } finally {
      setIsUploading(false)
    }
  }
  
  // Function to retry upload after error
  const resetUpload = () => {
    setError('')
    setFileInfo(null)
    setUploadProgress(null)
    const fileInput = document.getElementById('file-upload') as HTMLInputElement
    if (fileInput) fileInput.value = ''
  }

  return (
    <div className="w-full border border-blue-900/30 bg-gray-800/60 rounded-lg p-5">
      <div className="flex flex-col items-center text-center">
        <div className="mb-4">
          {isUploading ? (
            <div className="h-12 w-12 rounded-full bg-blue-900/40 flex items-center justify-center animate-pulse">
              <RefreshCw className="h-6 w-6 text-blue-400 animate-spin" />
            </div>
          ) : (
            <div className="h-12 w-12 rounded-full bg-blue-900/40 flex items-center justify-center">
              <Upload className="h-6 w-6 text-blue-400" />
            </div>
          )}
        </div>
        
        <h3 className="text-lg font-medium text-blue-100 mb-2">
          {isUploading ? 'Processing File...' : 'Upload Health Data'}
        </h3>
        
        <p className="text-sm text-blue-300/80 mb-4">
          {isUploading 
            ? 'Extracting health information from your file...' 
            : 'Upload a lab report, bloodwork PDF, or scan of your health data'}
        </p>
        
        {/* Progress bar for upload */}
        {uploadProgress !== null && (
          <div className="w-full h-2 bg-gray-700 rounded-full mb-4 overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-3 bg-red-900/40 border border-red-800/50 rounded-md text-sm text-red-200 flex items-start gap-2 w-full">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Error</p>
              <p>{error}</p>
              {error.includes('API key') && (
                <p className="mt-1 text-xs">The system admin needs to configure the AI service API key.</p>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 border-red-700/50 bg-red-900/30 hover:bg-red-800/50 text-red-200"
                onClick={resetUpload}
              >
                Try Again
              </Button>
            </div>
          </div>
        )}
        
        {fileInfo && !error && !isUploading && (
          <div className="mb-4 p-3 bg-green-900/30 border border-green-800/40 rounded-md text-sm text-green-200 flex items-start gap-2 w-full">
            <FileCheck className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">File Processed Successfully</p>
              <p className="text-xs mt-1">{fileInfo.name} • {(fileInfo.size / 1024).toFixed(1)} KB</p>
            </div>
          </div>
        )}
        
        <div className="w-full">
          <label className="relative">
            <input
              id="file-upload"
              type="file"
              className="sr-only"
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png,.xls,.xlsx,.csv"
              disabled={isUploading}
            />
            <div className={`w-full flex items-center justify-center px-4 py-2 rounded-md border ${isUploading ? 'bg-blue-900/30 border-blue-700/50 cursor-not-allowed' : 'bg-blue-900/20 border-blue-800/30 hover:bg-blue-800/30 cursor-pointer'}`}>
              <FileText className="h-5 w-5 mr-2 text-blue-400" />
              <span className="text-sm">
                {isUploading ? 'Processing...' : 'Choose File'}
              </span>
            </div>
          </label>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Supports PDF, JPEG, PNG, Excel/CSV • Max 10MB
          </p>
        </div>
      </div>
    </div>
  )
} 