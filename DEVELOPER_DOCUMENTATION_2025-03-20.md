# Health Insights AI - Developer Documentation

**Date: March 20, 2025**

## Project Overview

Health Insights AI is a web application that helps users understand health data, lab results, and medical terminology. It uses AI to provide explanations and insights about health metrics while maintaining a focus on education rather than medical advice.

## Technical Stack

- **Frontend**: Next.js 15.2.2 with TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Clerk (previously NextAuth)
- **Database**: PostgreSQL with Prisma ORM
- **AI Integration**: Google Generative AI (Gemini models)
- **Deployment**: Vercel

## Local Development

### Prerequisites

- Node.js v20.x
- npm/yarn
- PostgreSQL database (or access to a cloud instance)

### Environment Setup

1. Clone the repository:
   ```
   git clone https://github.com/akshaybapat6365/insight.git
   cd insight
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   - Create a `.env.local` file in the root directory with the following variables:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/health_insights"
   GOOGLE_API_KEY="your-gemini-api-key"
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your-clerk-publishable-key"
   CLERK_SECRET_KEY="your-clerk-secret-key"
   NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
   NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
   ```

4. Initialize the database:
   ```
   npx prisma generate
   npx prisma db push
   ```

5. Start the development server:
   ```
   npm run dev
   ```

## Project Structure

```
insight/
├── app/                    # Next.js app directory
│   ├── api/                # API routes
│   ├── chat/               # Chat interface pages
│   ├── health-analyzer/    # Health analyzer feature
│   ├── health-trends/      # Health trends visualization
│   ├── sign-in/            # Clerk authentication
│   ├── sign-up/            # Clerk registration
│   └── page.tsx            # Main application page
├── components/             # Reusable UI components
├── lib/                    # Shared utilities
│   ├── ai/                 # AI service providers
│   ├── db/                 # Database connection
│   └── services/           # Business logic services
├── prisma/                 # Prisma schema and migrations
├── public/                 # Static assets
└── middleware.ts           # Authentication middleware
```

## Authentication

The application uses Clerk for authentication. Key components:

- `middleware.ts`: Defines public and protected routes
- `components/auth-buttons.tsx`: Authentication UI components
- `app/sign-in` and `app/sign-up`: Clerk authentication pages

## Database Schema

The primary database models include:

- **User**: User profile information (managed by Clerk)
- **Chat**: Chat conversations between users and the AI
- **HealthMetric**: Health data metrics uploaded by users

## API Endpoints

- `/api/chat`: Handles chat interactions with the AI
- `/api/process-report-metrics`: Processes uploaded health reports and extracts metrics
- `/api/analyze-health-trends`: Analyzes trends in user health data

## Deployment

The application is deployed on Vercel with the following configuration:

- Custom domain: `health-insights-ai.vercel.app`
- Environment variables configured in Vercel project settings
- Node.js runtime for Serverless and Edge functions

### Deployment Process

Use the `deploy.sh` script in the root directory:
```
./deploy.sh
```

This script uses the Vercel CLI to deploy the application to production.

## Current Issues

1. **Deployment Errors**: Some builds fail with "Command 'npm run build' exited with 1"
2. **Routing Issues**: 404 errors on some client-side routes after deployment
3. **Configuration Conflicts**: Warnings about `builds` in `vercel.json`

## Troubleshooting

- If builds fail, check Vercel logs at `https://insight-[deploy-id]-akshay-bapats-projects.vercel.app/_logs`
- For local development issues outside the project directory, ensure you're in `/Users/akshaybapat/insight`
- For database issues, check connection with `npx prisma studio`

## Feature Roadmap

1. **Enhanced Chat Persistence**: Improve chat history storage and retrieval
2. **Advanced Health Analytics**: Add more sophisticated health metric analysis
3. **Export Functionality**: Allow users to download their health insights
4. **Mobile Optimization**: Improve mobile UI/UX

## Contributing

1. Create a feature branch from `main`
2. Implement changes following the project's code style
3. Write tests for new functionality
4. Submit a pull request with a clear description

## Security Considerations

- The application handles sensitive health data; ensure all endpoints use proper authentication
- Health disclaimers are included on all AI responses
- No personal health information is stored in chat history

## Next Steps for Development

1. Fix current deployment issues on Vercel
2. Complete integration with Clerk authentication throughout the application
3. Enhance error handling and logging
4. Implement comprehensive testing suite
5. Add user feedback mechanism for AI responses

## Contact

For questions or assistance, contact akshay.bapat@example.com 