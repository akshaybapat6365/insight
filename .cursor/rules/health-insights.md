# Health Insights AI Project Rules

## Overview
This application is a Next.js web app that processes health data (lab reports, bloodwork) using Google's Gemini API to provide AI-powered insights. The app features a dark-themed UI with glassmorphism effects and focuses on user privacy.

## General Guidelines
- Use TypeScript for all code
- Follow the existing folder structure and component organization
- Maintain the dark theme aesthetic with glassmorphism UI elements
- Include proper error handling for file processing and API calls
- Any health data displayed must include appropriate disclaimers
- Keep user privacy as a priority - don't store sensitive health data

## API Implementation
All API routes in app/api should:
- Implement proper error handling with clear messages
- Include fallback logic for Gemini API
- Follow existing patterns for file uploads and processing
- Access environment variables correctly
- Return appropriate HTTP status codes

## Component Development
Components should:
- Use shadcn/ui base components when available
- Follow the dark theme with correct Tailwind classes
- Be responsive and mobile-friendly
- Include loading states and error handling
- Implement accessibility attributes
- Use React hooks according to established patterns

## AI Integration
When working with AI features:
- Use the Gemini API provider from lib/ai/gemini-provider.ts
- Implement proper error handling with fallbacks
- Follow existing system prompt and configuration patterns
- Format AI responses to be human-readable
- Include appropriate health disclaimers with AI-generated content