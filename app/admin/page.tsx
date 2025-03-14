'use client'

import { useState, useEffect, ChangeEvent, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import Link from 'next/link'
import { HeartPulse, ArrowLeft, Settings, Bug, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

// Component that uses search params
function AdminContent() {
  const [systemPrompt, setSystemPrompt] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [message, setMessage] = useState('')
  const [errorDetails, setErrorDetails] = useState('')
  const [loading, setLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [showVercelInfo, setShowVercelInfo] = useState(false)
  
  // Get the search params to display the key (masked)
  const searchParams = useSearchParams()
  const keyParam = searchParams.get('key')
  
  // Get debug info
  useEffect(() => {
    fetch('/api/admin-debug')
      .then(res => res.json())
      .then(data => {
        setDebugInfo(data)
        console.log('Admin debug info:', data)
      })
      .catch(err => {
        console.error('Failed to load debug info:', err)
      })
  }, [])

  useEffect(() => {
    // Load the current system prompt
    setLoading(true)
    fetch('/api/admin/config')
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}: ${res.statusText}`)
        }
        return res.json()
      })
      .then(data => {
        console.log('Loaded config:', data)
        setSystemPrompt(data.systemPrompt || '')
        setMessage('')
        setErrorDetails('')
      })
      .catch(err => {
        console.error('Failed to load config:', err)
        setMessage('Failed to load current configuration')
        setErrorDetails(err.message || 'Unknown error')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const saveConfig = async () => {
    setLoading(true)
    setMessage('')
    setErrorDetails('')
    
    try {
      console.log('Saving config with system prompt length:', systemPrompt.length)
      
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
        setMessage(data.message || 'Configuration saved successfully!')
        setApiKey('') // Clear API key field after saving
        setShowVercelInfo(true) // Show Vercel info when saving succeeds
      } else {
        console.error('API error response:', data)
        setMessage(`Failed to save configuration: ${data.error || 'Unknown error'}`)
        setErrorDetails(JSON.stringify(data, null, 2))
      }
    } catch (error) {
      console.error('Error saving config:', error)
      setMessage('Error saving configuration')
      setErrorDetails(error instanceof Error ? error.message : 'Unknown error')
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
        
        {/* Vercel Environment Variables Info */}
        {showVercelInfo && (
          <Card className="border border-blue-900/30 bg-blue-900/10 backdrop-blur-sm mb-6">
            <CardHeader className="border-b border-blue-900/20 pb-3">
              <CardTitle className="flex items-center gap-2 text-xl text-blue-100">
                <Info className="h-5 w-5 text-blue-400" />
                Vercel Environment Variables
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <p className="text-blue-100">
                When deploying to Vercel, configuration changes must be made through the Vercel dashboard:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-blue-200">
                <li>Go to your Vercel project dashboard</li>
                <li>Navigate to "Settings" → "Environment Variables"</li>
                <li>Add or update the following variables:
                  <ul className="ml-6 mt-1 list-disc text-sm text-blue-300">
                    <li><code className="bg-blue-950/50 px-1.5 py-0.5 rounded">SYSTEM_PROMPT</code> - Your AI system instructions</li>
                    <li><code className="bg-blue-950/50 px-1.5 py-0.5 rounded">GEMINI_API_KEY</code> - Your Gemini API key</li>
                  </ul>
                </li>
                <li>Save changes and redeploy your application</li>
              </ol>
              <div className="bg-blue-950/30 p-3 rounded text-sm text-blue-200 mt-2">
                <p className="font-medium">Note:</p>
                <p>Any changes made here are logged but not permanently saved on Vercel's serverless platform.</p>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Debug Card */}
        <Card className="border border-yellow-900/30 bg-yellow-900/10 backdrop-blur-sm mb-6">
          <CardHeader className="border-b border-yellow-900/20 pb-3">
            <CardTitle className="flex items-center gap-2 text-xl text-yellow-100">
              <Bug className="h-5 w-5 text-yellow-400" />
              Debug Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div>
              <h3 className="text-sm font-medium text-yellow-200 mb-2">Access Parameters</h3>
              <div className="bg-gray-900/50 p-3 rounded text-xs font-mono">
                <p>URL key parameter: {keyParam ? '✅ Present' : '❌ Missing'}</p>
                {keyParam && <p>Key parameter value: {keyParam.substring(0, 2)}{'*'.repeat(Math.max(0, keyParam.length - 4))}{keyParam.substring(keyParam.length - 2)}</p>}
              </div>
            </div>
            
            {debugInfo && (
              <div>
                <h3 className="text-sm font-medium text-yellow-200 mb-2">Environment Variables</h3>
                <div className="bg-gray-900/50 p-3 rounded text-xs font-mono">
                  <p>ADMIN_PASSWORD set: {debugInfo.admin_password_set ? '✅ Yes' : '❌ No'}</p>
                  <p>NEXT_PUBLIC_ADMIN_KEY set: {debugInfo.public_admin_key_set ? '✅ Yes' : '❌ No'}</p>
                  <p>ADMIN_PASSWORD length: {debugInfo.admin_password_sample ? debugInfo.admin_password_sample.length : 0}</p>
                  <p>NEXT_PUBLIC_ADMIN_KEY length: {debugInfo.public_admin_key_sample ? debugInfo.public_admin_key_sample.length : 0}</p>
                </div>
              </div>
            )}
            
            <div>
              <h3 className="text-sm font-medium text-yellow-200 mb-2">Troubleshooting Tips</h3>
              <ul className="list-disc list-inside text-xs text-yellow-100/80 space-y-1">
                <li>Ensure the 'key' parameter matches the ADMIN_PASSWORD environment variable</li>
                <li>Check for proper URL encoding in the key parameter</li>
                <li>Verify both environment variables are set in Vercel</li>
                <li>Try clearing browser cache or using incognito mode</li>
              </ul>
            </div>
          </CardContent>
        </Card>
        
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
                disabled={loading}
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
                disabled={loading}
              />
            </div>
            
            {message && (
              <div className={`p-3 rounded ${message.includes('success') || message.includes('dashboard') ? 'bg-green-900/20 border border-green-900/30 text-green-300' : 'bg-red-900/20 border border-red-900/30 text-red-300'}`}>
                <div className="flex gap-2 items-start">
                  {message.includes('success') || message.includes('dashboard') ? (
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-medium">{message}</p>
                    {errorDetails && (
                      <pre className="mt-2 p-2 bg-black/20 rounded text-xs overflow-x-auto">
                        {errorDetails}
                      </pre>
                    )}
                  </div>
                </div>
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
  );
}

// Main admin page with suspense boundary
export default function AdminPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-gray-950 to-blue-950 py-8 flex items-center justify-center">
        <div className="bg-gray-900/70 p-6 rounded-lg border border-blue-900/30 shadow-xl">
          <h2 className="text-xl font-medium text-blue-100 mb-3">Loading Admin Panel...</h2>
          <div className="flex space-x-2 justify-center">
            <div className="h-3 w-3 bg-blue-500 rounded-full animate-pulse"></div>
            <div className="h-3 w-3 bg-blue-500 rounded-full animate-pulse delay-75"></div>
            <div className="h-3 w-3 bg-blue-500 rounded-full animate-pulse delay-150"></div>
          </div>
        </div>
      </div>
    }>
      <AdminContent />
    </Suspense>
  );
} 