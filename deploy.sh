#!/bin/bash

# Deployment script for Health Insights AI
echo "Deploying Health Insights AI to Vercel..."

# Define environment variables
GEMINI_API_KEY="add-your-api-key-here" # Replace with your actual API key
NEXTAUTH_SECRET="healthinsightsaisecret"
NEXTAUTH_URL="https://health-insights-ai.vercel.app"
GOOGLE_CLIENT_ID="your-google-client-id" # Replace with actual value
GOOGLE_CLIENT_SECRET="your-google-client-secret" # Replace with actual value
ADMIN_PASSWORD="adminpass"
CLERK_SECRET_KEY="your-clerk-secret-key" # Replace with actual Clerk secret key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your-clerk-publishable-key" # Replace with actual Clerk publishable key
SYSTEM_PROMPT="You are a health analysis assistant that helps users understand their bloodwork and medical reports."
DEFAULT_GEMINI_MODEL="gemini-1.5-pro"
USE_FALLBACK_MODEL="true"
MAX_OUTPUT_TOKENS="1000"

# Deploy to Vercel with environment variables
npx vercel deploy --prod \
  --env GEMINI_API_KEY="$GEMINI_API_KEY" \
  --env NEXTAUTH_SECRET="$NEXTAUTH_SECRET" \
  --env NEXTAUTH_URL="$NEXTAUTH_URL" \
  --env GOOGLE_CLIENT_ID="$GOOGLE_CLIENT_ID" \
  --env GOOGLE_CLIENT_SECRET="$GOOGLE_CLIENT_SECRET" \
  --env ADMIN_PASSWORD="$ADMIN_PASSWORD" \
  --env CLERK_SECRET_KEY="$CLERK_SECRET_KEY" \
  --env NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" \
  --env SYSTEM_PROMPT="$SYSTEM_PROMPT" \
  --env DEFAULT_GEMINI_MODEL="$DEFAULT_GEMINI_MODEL" \
  --env USE_FALLBACK_MODEL="$USE_FALLBACK_MODEL" \
  --env MAX_OUTPUT_TOKENS="$MAX_OUTPUT_TOKENS"

echo "Deployment complete! Visit your application at $NEXTAUTH_URL" 