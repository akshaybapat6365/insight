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

# Deploy to Vercel with environment variables
npx vercel deploy --prod \
  --env GEMINI_API_KEY="$GEMINI_API_KEY" \
  --env NEXTAUTH_SECRET="$NEXTAUTH_SECRET" \
  --env NEXTAUTH_URL="$NEXTAUTH_URL" \
  --env GOOGLE_CLIENT_ID="$GOOGLE_CLIENT_ID" \
  --env GOOGLE_CLIENT_SECRET="$GOOGLE_CLIENT_SECRET" \
  --env ADMIN_PASSWORD="$ADMIN_PASSWORD"

echo "Deployment complete! Visit your application at $NEXTAUTH_URL" 