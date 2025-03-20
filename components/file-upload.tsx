'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, FileText, AlertCircle, FileType, FileCheck, RefreshCw } from 'lucide-react'

const widthClasses: Record<number, string> = {
  0: 'w-[0%]',
  10: 'w-[10%]',
  20: 'w-[20%]',
  30: 'w-[30%]',
  40: 'w-[40%]',
  50: 'w-[50%]',
  60: 'w-[60%]',
  70: 'w-[70%]',
  80: 'w-[80%]',
  90: 'w-[90%]',
  100: 'w-[100%]'
};

export function FileUpload({ onFileProcessed }: { onFileProcessed: (text: string) => void }) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [fileInfo, setFileInfo] = useState<{name: string, type: string, size: number} | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Reset previous errors and state
    setError('')
    setUploadProgress(null)
    
    // Improved file type detection combining MIME type and extension
    const validTypes = [
      'application/pdf', 
      'image/jpeg', 
      'image/jpg', 
      'image/png', 
      'application/vnd.ms-excel', 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
      'text/csv',
      'text/plain',
      'application/octet-stream' // For some systems that don't properly set MIME types
    ];
    
    // Get file extension
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    const validExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'xls', 'xlsx', 'csv', 'txt'];
    
    // Check if either MIME type or extension is valid
    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      setError(
        `Unsupported file type: ${file.type} (.${fileExtension}). ` +
        `Please upload a PDF, JPEG, PNG, Excel/CSV file or text file.`
      );
      return;
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
          // Add health disclaimer to the processed text
          const textWithDisclaimer = 
            `${data.text}\n\n---\nDISCLAIMER: This AI analysis is for informational purposes only and does not constitute medical advice. ` +
            `Always consult with qualified healthcare professionals for interpreting health data and making medical decisions.`;
            
          onFileProcessed(textWithDisclaimer)
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
    <div className="w-full border border-gray-800 bg-black rounded-lg p-5">
      <div className="flex flex-col items-center text-center">
        <div className="mb-4">
          {isUploading ? (
            <div className="h-12 w-12 rounded-full bg-gray-900 flex items-center justify-center animate-pulse">
              <RefreshCw className="h-6 w-6 text-gray-400 animate-spin" />
            </div>
          ) : (
            <div className="h-12 w-12 rounded-full bg-gray-900 flex items-center justify-center">
              <Upload className="h-6 w-6 text-gray-400" />
            </div>
          )}
        </div>
        
        <h3 className="text-lg font-medium text-white mb-2">
          {isUploading ? 'Processing File...' : 'Upload Health Data'}
        </h3>
        
        <p className="text-sm text-gray-400 mb-4">
          {isUploading 
            ? 'Extracting health information from your file...' 
            : 'Upload a lab report, bloodwork PDF, or scan of your health data'}
        </p>
        
        {/* Progress bar for upload */}
        {uploadProgress !== null && (
          <div className="w-full h-2 bg-gray-900 rounded-full mb-4 overflow-hidden">
            <div
              className={`h-full bg-gray-600 rounded-full transition-all duration-300 ease-out ${widthClasses[uploadProgress]}`}
            ></div>
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-3 bg-gray-900 border border-red-900/50 rounded-md text-sm text-gray-300 flex items-start gap-2 w-full">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Error</p>
              <p>{error}</p>
              {error.includes('API key') && (
                <p className="mt-1 text-xs">The system admin needs to configure the AI service API key.</p>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 border-gray-700 bg-gray-800 hover:bg-gray-700 text-gray-300"
                onClick={resetUpload}
              >
                Try Again
              </Button>
            </div>
          </div>
        )}
        
        {fileInfo && !error && !isUploading && (
          <div className="mb-4 p-3 bg-gray-900 border border-gray-800 rounded-md text-sm text-gray-300 flex items-start gap-2 w-full">
            <FileCheck className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">File Processed Successfully</p>
              <p className="text-xs mt-1">{fileInfo.name} • {(fileInfo.size / 1024).toFixed(1)} KB</p>
              <p className="text-xs mt-1 text-gray-500">DISCLAIMER: Analysis is for informational purposes only, not medical advice.</p>
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
            <div className={`w-full flex items-center justify-center px-4 py-2 rounded-md border ${isUploading ? 'bg-gray-900 border-gray-700 cursor-not-allowed' : 'bg-gray-900 border-gray-800 hover:bg-gray-800 cursor-pointer'}`}>
              <FileText className="h-5 w-5 mr-2 text-gray-400" />
              <span className="text-sm text-gray-300">
                {isUploading ? 'Processing...' : 'Choose File'}
              </span>
            </div>
          </label>
          <p className="text-xs text-gray-600 mt-2 text-center">
            Supports PDF, JPEG, PNG, Excel/CSV, TXT • Max 10MB
          </p>
        </div>
      </div>
    </div>
  )
}