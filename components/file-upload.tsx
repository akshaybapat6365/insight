'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, FileText, AlertCircle, FileType } from 'lucide-react'

export function FileUpload({ onFileProcessed }: { onFileProcessed: (text: string) => void }) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [fileInfo, setFileInfo] = useState<{name: string, type: string, size: number} | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Check file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv']
    if (!validTypes.includes(file.type)) {
      setError(`Unsupported file type: ${file.type}. Please upload a PDF, JPEG, PNG, or Excel/CSV file`)
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
    
    try {
      console.log(`Starting upload of ${file.name} (${file.type}, ${file.size} bytes)`)
      
      const formData = new FormData()
      formData.append('file', file)
      
      console.log('Sending request to process-file API...')
      const response = await fetch('/api/process-file', {
        method: 'POST',
        body: formData
      })
      
      console.log('Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        console.error('API error response:', errorData)
        throw new Error(errorData?.error || `Server error: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('File processed successfully, extracted text length:', data.text?.length || 0)
      
      if (!data.text || data.text.trim() === '') {
        throw new Error('No text was extracted from the file. Please try a different file.')
      }
      
      // Call the callback with the extracted text
      onFileProcessed(
        `I'm uploading my health report for analysis. Here's the extracted content:\n\n${data.text}\n\nPlease analyze these results and explain what they mean for my health.`
      )
      
    } catch (err: any) {
      console.error('Error uploading file:', err)
      setError(`Error processing file: ${err.message || 'Unknown error'}. Please try again.`)
    } finally {
      setIsUploading(false)
      // Reset the input
      e.target.value = ''
    }
  }
  
  return (
    <div className="mb-4">
      <div className="flex items-center gap-3">
        <Button 
          className="flex items-center gap-2 bg-medical-primary hover:bg-medical-accent text-white text-sm py-1 px-3 rounded shadow-sm transition-colors"
          onClick={() => document.getElementById('file-upload')?.click()}
          disabled={isUploading}
        >
          {isUploading ? 'Processing...' : 'Upload Health Report'}
          <Upload className="h-4 w-4" />
        </Button>
        <p className="text-xs text-medical-light flex items-center gap-1">
          <FileText className="h-3 w-3" />
          Upload bloodwork results, lab reports, or medical PDFs
        </p>
      </div>
      
      <input 
        id="file-upload"
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.csv"
        onChange={handleFileChange}
        disabled={isUploading}
      />
      
      {fileInfo && (
        <div className="mt-2 text-xs text-medical-light bg-medical-primary/5 p-2 rounded flex items-center gap-1">
          <FileType className="h-3 w-3" />
          File: {fileInfo.name} ({fileInfo.type}, {Math.round(fileInfo.size / 1024)} KB)
        </div>
      )}
      
      {error && (
        <div className="mt-2 text-sm text-red-500 flex items-center gap-1 bg-red-500/10 p-2 rounded">
          <AlertCircle className="h-3 w-3" />
          {error}
        </div>
      )}

      {isUploading && (
        <div className="mt-2 text-sm text-medical-accent flex items-center gap-1 bg-medical-primary/10 p-2 rounded">
          <div className="flex items-center">
            <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-medical-accent rounded-full"></div>
            Analyzing your health data...
          </div>
        </div>
      )}
    </div>
  )
} 