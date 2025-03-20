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

## Implementation Steps for Google Auth and Admin Console

1. **Client-Side Google API Usage**
   - Leverage Google’s client libraries for user-facing AI calls or data processing. Ensure any environment variable used (like an API key) is carefully managed or set up so that it is not exposed in the client bundle. If it must be exposed, provide disclaimers and consider ephemeral tokens.

2. **Google Sign-In**
   - Integrate Google OAuth (e.g., NextAuth or a custom strategy) to let users log in. This involves creating a route (like `/api/auth/[...nextauth].ts`) that handles login and callback logic. Keep sensitive client secrets on the server side if calling the Google APIs from there.

3. **Persistent Chats and Data**
   - If data is stored purely on the client side, use `localStorage` or `IndexedDB` to hold chat histories and health data, ensuring disclaimers about local encryption. For multi-device sync, store this information in a secured server-side database, associated with the user’s Google account ID.

4. **Admin Console**
   - Create a new route (e.g., `/admin`) that checks the user’s role or ID to ensure only designated accounts can access. Implement pages to manage any server configurations, API usage stats, or environment variable toggles. Log changes for accountability.

5. **Security and Privacy**
   - Use role-based access control to differentiate between normal users and administrators. Keep any environment secrets in `.env` files that are never exposed to the client. Encrypt user data at rest if you store any sensitive health information.

6. **Dark Theme and Glassmorphism**
   - Continue following Tailwind and shadcn/ui best practices. Provide appropriate `className` overrides and utility classes for glassmorphism elements (e.g., `backdrop-blur`, `bg-opacity-xx`). Test accessibility and color contrast thoroughly.

7. **Error Handling**
   - For front-end API calls, always wrap them in try/catch blocks. Use user-friendly error messages when a call fails or times out.

8. **Finalize Deployment**
   - Verify that all environment variables are set in your hosting service. Configure OAuth client credentials properly on Google Cloud, restricting redirect URLs to your production domain.

## Additional Best Practices

1. **Code Consistency and Organization**
   - Adhere to a uniform coding style, including naming conventions for components, hooks, and utility functions.
   - Keep related files grouped logically (e.g., group AI providers under `lib/ai`).
   - Document complex functions and components for better maintainability.

2. **Testing and Quality Assurance**
   - Implement automated tests (unit, integration, and end-to-end) to ensure consistent behavior across updates.
   - Use testing libraries compatible with Next.js and React (e.g., Jest, React Testing Library, Playwright for E2E tests).
   - Ensure all critical features (e.g., file uploads, AI calls) have test coverage.

3. **Accessibility (A11y)**
   - Enforce accessible naming for UI elements and aria attributes where appropriate.
   - Keep color contrast to WCAG AA or AAA standards and verify with automated accessibility tools.
   - Provide keyboard navigation and skip links to critical sections.

4. **Performance Optimization**
   - Optimize images and other static assets.
   - Implement code splitting or dynamic imports for large modules.
   - Use client-side caching or memoization (e.g., React Query, SWR) for frequently requested data.

5. **Enhanced Error Reporting and Monitoring**
   - Integrate logs and metrics for API requests in development and production.
   - Use error tracking services (e.g., Sentry) to capture client-side and server-side exceptions.
   - Include user-friendly error messages and fallback UIs for unhandled exceptions.

6. **Ongoing Security Audits**
   - Regularly audit environment variables, external services, and user-generated inputs for vulnerabilities.
   - Keep dependencies updated to mitigate known security vulnerabilities.
   - Restrict direct file system access or dangerous operations within APIs.

7. **Scalability Considerations**
   - Plan database schemas and indexes for large-scale usage.
   - Validate readiness for load balancing or CDN usage.
   - Identify potential single points of failure and design mitigations.

8. **Continuous Documentation**
   - Keep an up-to-date README with project setup instructions, environment variable requirements, and deployment steps.
   - Maintain a changelog for major changes or new features.
   - Encourage thorough code comments, especially around AI logic, disclaimers, and data handling.
