'use client';

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function SignIn() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch (error) {
      console.error("Error signing in with Google:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black p-4">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-medium text-white">Health Insights AI</h1>
          </div>
          <div>
            <Link
              href="/"
              className="text-gray-400 hover:text-white text-sm flex items-center gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </header>
      
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-bold text-white">
              Sign in to your account
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              Log in to access personalized health insights and save your reports
            </p>
          </div>
          
          <div className="mt-8 space-y-6">
            <div className="bg-black border border-gray-800 rounded-lg p-6">
              <Button
                type="button"
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 py-2 px-4 rounded-md font-medium"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-t-2 border-b-2 border-gray-900 rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                )}
                <span>Sign in with Google</span>
              </Button>
            </div>
            
            <div className="text-center text-sm">
              <p className="text-gray-500">
                By signing in, you agree to our{" "}
                <a href="#" className="text-gray-400 hover:text-white">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-gray-400 hover:text-white">
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <footer className="border-t border-gray-800 py-4">
        <div className="container text-center text-gray-500 text-sm">
          <p>© 2025 Health Insights AI. All rights reserved.</p>
          <p className="mt-1 text-xs">
            Disclaimer: This app provides educational information only, not medical advice.
          </p>
        </div>
      </footer>
    </div>
  );
} 