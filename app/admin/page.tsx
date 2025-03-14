'use client'

import { useState, useEffect, ChangeEvent, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import Link from 'next/link'
import { HeartPulse, ArrowLeft, Settings, Bug, AlertTriangle, CheckCircle, Info, RefreshCw, Server } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

// Component that uses search params
function AdminContent() {
  const [systemPrompt, setSystemPrompt] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [fallbackModel, setFallbackModel] = useState('gemini-1.5-pro')
  const [useFallback, setUseFallback] = useState(true)
  const [maxOutputTokens, setMaxOutputTokens] = useState('1000')
  const [message, setMessage] = useState('')
  const [errorDetails, setErrorDetails] = useState('')
  const [loading, setLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [showVercelInfo, setShowVercelInfo] = useState(false)
  const [configSaved, setConfigSaved] = useState(false)
  
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

  // Function to refresh config and debug info
  const refreshData = () => {
    setLoading(true);
    setMessage('');
    setErrorDetails('');
    
    // Refresh debug info
    fetch('/api/admin-debug')
      .then(res => res.json())
      .then(data => {
        setDebugInfo(data)
        console.log('Admin debug info refreshed:', data)
      })
      .catch(err => {
        console.error('Failed to refresh debug info:', err)
      });
    
    // Load the current configuration
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
        setFallbackModel(data.fallbackModel || 'gemini-1.5-pro')
        setUseFallback(data.useFallback !== undefined ? data.useFallback : true)
        setMaxOutputTokens(data.maxOutputTokens?.toString() || '1000')
        setMessage('Configuration refreshed successfully')
        setErrorDetails('')
        setConfigSaved(false)
      })
      .catch(err => {
        console.error('Failed to load config:', err)
        setMessage('Failed to load current configuration')
        setErrorDetails(err.message || 'Unknown error')
      })
      .finally(() => {
        setLoading(false)
      })
  };

  useEffect(() => {
    // Load the current system prompt on initial load
    refreshData();
  }, []);

  const saveConfig = async () => {
    setLoading(true)
    setMessage('')
    setErrorDetails('')
    setConfigSaved(false)
    
    try {
      console.log('Saving config with system prompt length:', systemPrompt.length)
      
      const payload: any = { 
        systemPrompt,
        fallbackModel,
        useFallback,
        maxOutputTokens: parseInt(maxOutputTokens, 10)
      };
      
      // Only include API key if it was provided
      if (apiKey) {
        payload.apiKey = apiKey;
      }
      
      console.log('Saving configuration with payload:', { 
        ...payload, 
        apiKey: apiKey ? '[API KEY PROVIDED]' : '[NO API KEY PROVIDED]' 
      });
      
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      const data = await res.json()
      
      if (res.ok && data.success) {
        setMessage(data.message || 'Configuration saved successfully!')
        setApiKey('') // Clear API key field after saving
        setShowVercelInfo(true) // Show Vercel info when saving succeeds
        setConfigSaved(true)
        
        // Update debug info after saving
        if (data.environmentInfo) {
          setDebugInfo((prev: any) => ({
            ...prev,
            ...data.environmentInfo
          }));
        }
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
    <div className="container py-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link 
            href={`/?key=${keyParam || ''}`} 
            className="text-blue-500 hover:text-blue-400 flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to app</span>
          </Link>
          <h1 className="text-xl font-semibold">Admin Console</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>
      
      {/* System Status */}
      <Card className="mb-8 bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-blue-400" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {debugInfo ? (
            <div className="text-sm grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><strong>Environment:</strong> {debugInfo.nodeEnv}</p>
                <p><strong>Running on Vercel:</strong> {debugInfo.isVercel ? 'Yes' : 'No'}</p>
                <p><strong>Server PID:</strong> {debugInfo.serverPid}</p>
                <p><strong>API Key Configured:</strong> {debugInfo.hasGeminiApiKey ? 'Yes' : 'No'}</p>
                <p><strong>System Prompt Set:</strong> {debugInfo.hasSystemPrompt ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <p><strong>Admin Password Set:</strong> {debugInfo.hasAdminPassword ? 'Yes' : 'No'}</p>
                <p><strong>Config File Exists:</strong> {debugInfo.hasConfigFile ? 'Yes' : 'No'}</p>
                <p><strong>Config Path:</strong> <code className="text-xs">{debugInfo.configPath}</code></p>
                <p>
                  <strong>Auth Key:</strong> {keyParam ? 
                    <span className="text-green-400">Provided ✓</span> : 
                    <span className="text-red-400">Missing ✗</span>}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-400">Loading system information...</p>
          )}
        </CardContent>
      </Card>
      
      {/* Main Configuration Card */}
      <Card className="mb-6 bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-400" />
            Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">System Prompt</label>
            <Textarea
              value={systemPrompt}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setSystemPrompt(e.target.value)}
              rows={6}
              placeholder="Enter the system prompt for the AI model..."
              className="w-full bg-gray-800 border-gray-700"
            />
            <p className="text-xs text-gray-400 mt-1">
              This defines how the AI assistant behaves when analyzing health data.
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Gemini API Key (Optional)</label>
            <Input
              type="password"
              value={apiKey}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setApiKey(e.target.value)}
              placeholder="Enter a new API key to update..."
              className="w-full bg-gray-800 border-gray-700"
            />
            <p className="text-xs text-gray-400 mt-1">
              Leave blank to keep the current API key. Get a key from <a href="https://makersuite.google.com/app/apikey" className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">Google MakerSuite</a>.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Fallback Model</label>
              <select
                value={fallbackModel}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setFallbackModel(e.target.value)}
                className="w-full p-2 rounded-md bg-gray-800 border border-gray-700 text-white"
              >
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">
                Model to use if the primary experimental model is unavailable.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Max Output Tokens</label>
              <Input
                type="number"
                value={maxOutputTokens}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setMaxOutputTokens(e.target.value)}
                min="100"
                max="8192"
                className="w-full bg-gray-800 border-gray-700"
              />
              <p className="text-xs text-gray-400 mt-1">
                Maximum length of AI responses (100-8192).
              </p>
            </div>
            
            <div className="md:col-span-2 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useFallback}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setUseFallback(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-700 bg-gray-800 text-blue-600"
                />
                <span>Enable model fallback (recommended)</span>
              </label>
              <p className="text-xs text-gray-400 mt-1 ml-6">
                If checked, the system will fall back to the standard model if the experimental model fails.
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t border-gray-800 pt-4">
          <div>
            {message && (
              <div className={`flex items-start gap-2 text-sm ${configSaved ? 'text-green-400' : 'text-red-400'}`}>
                {configSaved ? <CheckCircle className="h-4 w-4 mt-0.5" /> : <AlertTriangle className="h-4 w-4 mt-0.5" />}
                <div>
                  <p>{message}</p>
                  {errorDetails && <pre className="mt-1 text-xs overflow-auto max-h-24 p-1 bg-gray-800 rounded">{errorDetails}</pre>}
                </div>
              </div>
            )}
          </div>
          <Button 
            onClick={saveConfig} 
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 text-white"
          >
            {loading ? 'Saving...' : 'Save Configuration'}
          </Button>
        </CardFooter>
      </Card>
      
      {/* Vercel deployment info */}
      {showVercelInfo && (
        <Card className="mb-6 bg-blue-950/30 border-blue-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Info className="h-5 w-5 text-blue-400" />
              Deployment Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-300">
              For persistent configuration in production deployment, set the following environment variables in your Vercel project:
            </p>
            <ul className="list-disc list-inside text-xs text-blue-200 mt-2 space-y-1">
              <li><code>GEMINI_API_KEY</code> - Your Gemini AI API key</li>
              <li><code>SYSTEM_PROMPT</code> - Custom system prompt if desired</li>
              <li><code>ADMIN_PASSWORD</code> - Admin console password</li>
              <li><code>DEFAULT_GEMINI_MODEL</code> - Fallback model name</li>
              <li><code>USE_FALLBACK_MODEL</code> - Set to 'true' or 'false'</li>
            </ul>
            <p className="text-xs text-blue-300 mt-3">
              <a href="https://vercel.com/docs/environment-variables" className="underline" target="_blank" rel="noopener noreferrer">
                Learn more about Vercel environment variables
              </a>
            </p>
          </CardContent>
        </Card>
      )}
      
      {/* Debug card */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5 text-blue-400" />
            Debug Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm">
            <p>This information is useful for debugging configuration issues:</p>
            
            <div className="mt-3 space-y-2">
              <p>
                <strong>Current URL:</strong>{' '}
                <code className="text-xs bg-gray-800 px-1 py-0.5 rounded">
                  {typeof window !== 'undefined' ? window.location.href : 'Not available'}
                </code>
              </p>
              
              <p>
                <strong>Key Parameter:</strong>{' '}
                {keyParam ? (
                  <code className="text-xs bg-gray-800 px-1 py-0.5 rounded">
                    {keyParam.substring(0, 3)}***{keyParam.substring(keyParam.length - 3)}
                  </code>
                ) : (
                  <span className="text-red-400">Not provided</span>
                )}
              </p>
              
              <p>
                <strong>PDF Upload Issues:</strong>{' '}
                If you're experiencing issues with PDF uploads, check the following:
              </p>
              <ul className="list-disc list-inside text-xs ml-4 text-gray-300 space-y-1">
                <li>Maximum file size is 10MB</li>
                <li>PDF should be text-based, not scanned images without OCR</li>
                <li>Gemini API key must be valid with appropriate permissions</li>
                <li>Network connectivity to Google's Gemini API servers</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Wrap the component with Suspense
export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-blue-950 text-white">
      <header className="border-b border-blue-900/30 bg-gray-900/70 backdrop-blur-sm p-4">
        <div className="container">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
              <HeartPulse className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-lg font-medium text-blue-100">Health Insights AI <span className="text-blue-400">Admin</span></h1>
          </div>
        </div>
      </header>
      
      <Suspense fallback={<div className="container py-8 text-center">Loading admin console...</div>}>
        <AdminContent />
      </Suspense>
    </div>
  )
} 