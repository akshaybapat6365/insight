'use client'

import { useState, useEffect, ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import Link from 'next/link'
import { HeartPulse, ArrowLeft, Settings } from 'lucide-react'

export default function AdminPage() {
  const [systemPrompt, setSystemPrompt] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Load the current system prompt
    fetch('/api/admin/config')
      .then(res => res.json())
      .then(data => {
        setSystemPrompt(data.systemPrompt || '')
      })
      .catch(err => {
        console.error('Failed to load config:', err)
        setMessage('Failed to load current configuration')
      })
  }, [])

  const saveConfig = async () => {
    setLoading(true)
    setMessage('')
    
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          systemPrompt,
          apiKey: apiKey || undefined // Only send if changed
        })
      })
      
      const data = await res.json()
      
      if (res.ok && data.success) {
        setMessage('Configuration saved successfully!')
        setApiKey('') // Clear API key field after saving
      } else {
        setMessage(`Failed to save configuration: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error saving config:', error)
      setMessage('Error saving configuration')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-blue-950 py-8">
      <div className="container max-w-2xl">
        <div className="mb-6 flex items-center gap-2">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-blue-300 hover:text-blue-100 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to chat</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
            <HeartPulse className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-blue-100">Health Insights Admin</h1>
        </div>
        
        <Card className="border border-blue-900/30 bg-gray-900/70 backdrop-blur-sm">
          <CardHeader className="border-b border-blue-900/20 pb-3">
            <CardTitle className="flex items-center gap-2 text-xl text-blue-100">
              <Settings className="h-5 w-5 text-blue-400" />
              Configuration Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2">
              <label className="text-sm text-blue-200 font-medium">System Prompt</label>
              <Textarea 
                rows={10}
                value={systemPrompt}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setSystemPrompt(e.target.value)}
                placeholder="Enter the system prompt for the health assistant..."
                className="bg-gray-800/50 border-blue-900/30 text-gray-100 focus-visible:ring-blue-500"
              />
              <p className="text-xs text-gray-400">This is the base prompt that instructs the AI how to analyze health data</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm text-blue-200 font-medium">Gemini API Key (leave blank to keep current)</label>
              <Input 
                type="password"
                value={apiKey}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setApiKey(e.target.value)}
                placeholder="Enter new Gemini API key" 
                className="bg-gray-800/50 border-blue-900/30 text-gray-100 focus-visible:ring-blue-500"
              />
            </div>
            
            {message && (
              <div className={`p-3 rounded ${message.includes('success') ? 'bg-green-900/20 border border-green-900/30 text-green-300' : 'bg-red-900/20 border border-red-900/30 text-red-300'}`}>
                {message}
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t border-blue-900/20 pt-4">
            <Button 
              onClick={saveConfig}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Configuration'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
} 