export default function AdminLinkTest() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-blue-950 p-8">
      <div className="max-w-md mx-auto bg-gray-900/70 rounded-lg p-6 shadow-lg border border-blue-900/30">
        <h1 className="text-2xl font-bold text-blue-100 mb-6">Admin Access Test Links</h1>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-lg text-blue-200 font-medium">Direct Links</h2>
            <ul className="list-disc list-inside space-y-3">
              <li>
                <a 
                  href="/admin?key=adminpass" 
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  Admin with Hardcoded Password
                </a>
              </li>
              <li>
                <a 
                  href="/admin-simple?key=adminpass" 
                  className="text-green-400 hover:text-green-300 underline"
                >
                  Simple Admin Page (Minimal Version)
                </a>
              </li>
              <li>
                <a 
                  href="/admin-test?key=adminpass" 
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  Admin Test Page with Password
                </a>
              </li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-lg text-blue-200 font-medium">Troubleshooting</h2>
            <p className="text-gray-300 text-sm">
              If neither link works, there may be an issue with:
            </p>
            <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
              <li>Middleware authentication logic</li>
              <li>Suspense boundary implementation</li>
              <li>Environment variables in Vercel</li>
            </ul>
          </div>
          
          <div className="pt-4 border-t border-blue-900/20">
            <a 
              href="/" 
              className="text-blue-400 hover:text-blue-300 text-sm underline"
            >
              Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 