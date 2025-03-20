'use client';

import { SignUp } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="p-4 w-full max-w-md">
        <h1 className="text-2xl font-bold text-white text-center mb-6">
          Create Your Health Insights AI Account
        </h1>
        <SignUp 
          appearance={{
            baseTheme: dark,
            elements: {
              formButtonPrimary: "bg-gray-900 hover:bg-gray-800 text-white",
              card: "bg-black-light border border-dark rounded-lg",
              headerTitle: "text-white",
              headerSubtitle: "text-gray-400",
              formFieldLabel: "text-gray-300",
              formFieldInput: "bg-black border-dark text-white",
              footerActionLink: "text-gray-400 hover:text-white",
              dividerLine: "bg-gray-700",
              dividerText: "text-gray-400"
            }
          }}
        />
      </div>
    </div>
  );
} 