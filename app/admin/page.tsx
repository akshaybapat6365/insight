'use client'

import { useState, useEffect, ChangeEvent, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import Link from 'next/link'
import { HeartPulse, ArrowLeft, Settings, Bug, AlertTriangle, CheckCircle, Info, RefreshCw, Server } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

// Interface for config state
interface ConfigState {
  systemPrompt: string;
  fallbackModel: string;
  useFallback: boolean;
  maxOutputTokens: number;
}

// Validation interface
interface ValidationErrors {
  maxOutputTokens?: string;
}

// Component that uses search params
function AdminContent() {
  // Consolidated state for configuration fields
  const [config, setConfig] = useState<ConfigState>({
    systemPrompt: '',
    fallbackModel: 'gemini-1.5-pro',
    useFallback: true,
    maxOutputTokens: 1000
  });
  
  // API key management
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [maskedApiKey, setMaskedApiKey] = useState('');
  
  // UI state
  const [statusMessage, setStatusMessage] = useState('')
  const [errorDetails, setErrorDetails] = useState('')
  const [loading, setLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [showVercelInfo, setShowVercelInfo] = useState(false)
  const [configSaved, setConfigSaved] = useState(false)
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  
  // Get the user from Clerk
  const { user, isLoaded } = useUser()
  const router = useRouter()
  
  // Handle input changes
  const handleConfigChange = (field: keyof ConfigState, value: string | boolean | number) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    
    // Clear validation errors when field is edited
    if (field in validationErrors) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as keyof ValidationErrors];
        return newErrors;
      });
    }
  };
  
  // Validate config before saving
  const validateConfig = (): boolean => {
    const errors: ValidationErrors = {};
    
    // Validate maxOutputTokens
    if (typeof config.maxOutputTokens !== 'number') {
      errors.maxOutputTokens = 'Max output tokens must be a number';
    } else if (config.maxOutputTokens < 100 || config.maxOutputTokens > 8192) {
      errors.maxOutputTokens = 'Max output tokens must be between 100 and 8192';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Get debug info
  useEffect(() => {
    if (isLoaded && !user) {
      // Redirect unauthenticated users
      router.push('/')
      return
    }

    fetch('/api/admin-debug')
      .then(res => res.json())
      .then(data => {
        setDebugInfo(data)
        console.log('Admin debug info:', data)
      })
      .catch(err => {
        console.error('Failed to load debug info:', err)
      })
  }, [isLoaded, user, router])

  // Function to refresh config and debug info
  const refreshData = () => {
    setLoading(true);
    setStatusMessage('');
    setErrorDetails('');
    setValidationErrors({});
    
    // Refresh debug info
    fetch('/api/admin-debug')
      .then(res => res.json())
      .then(data => {
        setDebugInfo(data)
        console.log('Admin debug info refreshed:', data)
      })
      .catch(err => {
        console.error('Failed to refresh debug info:', err)
        setStatusMessage('Failed to refresh debug info')
        setErrorDetails(err.message || 'Unknown error')
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
        setConfig({
          systemPrompt: data.systemPrompt || '',
          fallbackModel: data.fallbackModel || 'gemini-1.5-pro',
          useFallback: data.useFallback !== undefined ? data.useFallback : true,
          maxOutputTokens: data.maxOutputTokens || 1000
        });
        setMaskedApiKey(data.hasApiKey ? '******' : '');
        setStatusMessage('Configuration refreshed successfully')
        setErrorDetails('')
        setConfigSaved(false)
      })
      .catch(err => {
        console.error('Failed to load config:', err)
        setStatusMessage('Failed to load current configuration')
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
    // Validate before saving
    if (!validateConfig()) {
      setStatusMessage('Please fix the validation errors before saving');
      return;
    }
    
    setLoading(true)
    setStatusMessage('')
    setErrorDetails('')
    setConfigSaved(false)
    
    try {
      console.log('Saving config with system prompt length:', config.systemPrompt.length)
      
      const payload: any = { 
        systemPrompt: config.systemPrompt,
        fallbackModel: config.fallbackModel,
        useFallback: config.useFallback,
        maxOutputTokens: config.maxOutputTokens
      };
      
      // Only include API key if it was provided
      if (apiKeyInput) {
        payload.apiKey = apiKeyInput;
      }
      
      console.log('Saving configuration with payload:', { 
        ...payload, 
        apiKey: apiKeyInput ? '[API KEY PROVIDED]' : '[NO API KEY PROVIDED]' 
      });
      
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      const data = await res.json()
      
      if (res.ok && data.success) {
        setStatusMessage(data.message || 'Configuration saved successfully!')
        // Clear API key field after saving
        setApiKeyInput('')
        setMaskedApiKey(apiKeyInput ? '******' : maskedApiKey);
        setShowVercelInfo(!!data.isEphemeral) // Only show warning for ephemeral changes
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
        setStatusMessage(`Failed to save configuration: ${data.error || 'Unknown error'}`)
        setErrorDetails(JSON.stringify(data, null, 2))
      }
    } catch (error) {
      console.error('Error saving config:', error)
      setStatusMessage('Error saving configuration')
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
            href="/" 
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
                  <strong>Auth Key:</strong> {user ? 
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
      
      {/* Vercel Environment Warning */}
      {debugInfo?.isVercel && (
        <Card className="mb-6 bg-amber-900/20 border-amber-800/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-300 mb-1">Production Environment Warning</h3>
                <p className="text-sm text-amber-200/80 mb-2">
                  You are making changes in a <strong>Vercel serverless environment</strong>. Any configuration changes made here 
                  will only affect the current serverless function instance and will be lost when:
                </p>
                <ul className="text-sm text-amber-200/80 list-disc pl-5 mb-2 space-y-1">
                  <li>The function "cold starts" after inactivity</li>
                  <li>A new deployment is made</li>
                  <li>Vercel scales your application to multiple instances</li>
                </ul>
                <p className="text-sm text-amber-200/80 font-medium">
                  For permanent configuration changes, set environment variables in the{" "}
                  <a 
                    href="https://vercel.com/dashboard" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                    aria-label="Open Vercel Dashboard"
                  >
                    Vercel Dashboard
                  </a>{" "}
                  under Project Settings → Environment Variables.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
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
              value={config.systemPrompt}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => 
                handleConfigChange('systemPrompt', e.target.value)}
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
              value={apiKeyInput}
              onChange={(e: ChangeEvent<HTMLInputElement>) => 
                setApiKeyInput(e.target.value)}
              placeholder="Enter a new API key to update..."
              className="w-full bg-gray-800 border-gray-700"
            />
            {maskedApiKey && (
              <p className="text-xs text-gray-400 mt-1">
                Current key: {maskedApiKey}
              </p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              Leave blank to keep the current API key. Get a key from <a href="https://makersuite.google.com/app/apikey" className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">Google MakerSuite</a>.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Fallback Model</label>
              <select
                className="w-full bg-gray-800 text-white rounded p-2 border border-gray-700"
                aria-label="Fallback Model Selection"
                onChange={(e: ChangeEvent<HTMLSelectElement>) => 
                  handleConfigChange('fallbackModel', e.target.value)}
                value={config.fallbackModel}
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
                value={config.maxOutputTokens.toString()}
                onChange={(e: ChangeEvent<HTMLInputElement>) => 
                  handleConfigChange('maxOutputTokens', parseInt(e.target.value, 10) || 0)}
                min="100"
                max="8192"
                className={`w-full bg-gray-800 border-gray-700 ${
                  validationErrors.maxOutputTokens ? 'border-red-500' : ''
                }`}
              />
              {validationErrors.maxOutputTokens && (
                <p className="text-xs text-red-400 mt-1">
                  {validationErrors.maxOutputTokens}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Maximum length of AI responses (100-8192).
              </p>
            </div>
            
            <div className="md:col-span-2 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.useFallback}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => 
                    handleConfigChange('useFallback', e.target.checked)}
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
            {statusMessage && (
              <div className={`flex items-start gap-2 text-sm ${configSaved ? 'text-green-400' : 'text-red-400'}`}>
                {configSaved ? <CheckCircle className="h-4 w-4 mt-0.5" /> : <AlertTriangle className="h-4 w-4 mt-0.5" />}
                <div>
                  <p>{statusMessage}</p>
                  {errorDetails && <pre className="mt-1 text-xs overflow-auto max-h-24 p-1 bg-gray-800 rounded">{errorDetails}</pre>}
                </div>
              </div>
            )}
          </div>
          <Button 
            onClick={saveConfig} 
            disabled={loading || Object.keys(validationErrors).length > 0}
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
                {user ? (
                  <code className="text-xs bg-gray-800 px-1 py-0.5 rounded">
                    {user.id.substring(0, 3)}***{user.id.substring(user.id.length - 3)}
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

// Main admin page component that uses Clerk auth
export default function AdminPage() {
  const { isLoaded, user } = useUser()
  const router = useRouter()
  
  // Redirect if not authenticated
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/')
    }
  }, [isLoaded, user, router])
  
  // Show loading while checking authentication
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }
  
  // If user isn't authenticated, don't show content
  if (!user) {
    return null
  }
  
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