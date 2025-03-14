'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, FileText, AlertCircle } from 'lucide-react'

export function FileUpload({ onFileProcessed }: { onFileProcessed: (text: string) => void }) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Check file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv']
    if (!validTypes.includes(file.type)) {
      setError('Please upload a PDF, JPEG, or Excel/CSV file')
      return
    }
    
    setIsUploading(true)
    setError('')
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/process-file', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error('Failed to process file')
      }
      
      const data = await response.json()
      
      // Call the callback with the extracted text
      onFileProcessed(
        `I'm uploading my health report for analysis. Here's the extracted content:\n\n${data.text}\n\nPlease analyze these results and explain what they mean for my health.`
      )
      
    } catch (err) {
      console.error('Error uploading file:', err)
      setError('Error processing file. Please try again.')
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
        accept=".pdf,.jpg,.jpeg,.xlsx,.xls,.csv"
        onChange={handleFileChange}
        disabled={isUploading}
      />
      
      {error && (
        <div className="mt-2 text-sm text-red-500 flex items-center gap-1 bg-red-500/10 p-2 rounded">
          <AlertCircle className="h-3 w-3" />
          {error}
        </div>
      )}

      {isUploading && (
        <div className="mt-2 text-sm text-medical-accent flex items-center gap-1 bg-medical-primary/10 p-2 rounded">
          <div className="animate-pulse">Analyzing your health data...</div>
        </div>
      )}
    </div>
  )
} 