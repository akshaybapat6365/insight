# Health Insights AI Implementation Guide

This guide provides comprehensive instructions for setting up, configuring, and deploying the Health Insights AI application.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Setup and Installation](#setup-and-installation)
3. [Authentication Configuration](#authentication-configuration)
4. [Database Setup](#database-setup)
5. [API Keys and Models](#api-keys-and-models)
6. [Development Workflow](#development-workflow)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)

## Project Overview

Health Insights AI is an application that allows users to upload health-related documents (lab reports, medical tests, etc.) and receive AI-powered analysis and insights. The application uses:

- **Next.js**: For the frontend and API routes
- **Clerk**: For authentication
- **Prisma**: For database access
- **Google Gemini AI**: For AI analysis
- **Tailwind CSS**: For styling

## Setup and Installation

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm or yarn
- Git

### Installation Steps

1. **Clone the repository**

```bash
git clone https://github.com/your-username/health-insights-ai.git
cd health-insights-ai
```

2. **Install dependencies**

```bash
npm install
# or
yarn install
```

3. **Set up environment variables**

Copy the example environment file and update it with your configuration:

```bash
cp .env.example .env.local
```

4. **Run the database setup script**

```bash
npm run db:setup
```

5. **Start the development server**

```bash
npm run dev
```

The application should now be running at [http://localhost:3000](http://localhost:3000).

## Authentication Configuration

### Clerk Authentication

1. Create an account at [clerk.dev](https://clerk.dev)
2. Create a new application in the Clerk dashboard
3. Configure the sign-in and sign-up URLs as follows:
   - Sign In URL: `/sign-in`
   - Sign Up URL: `/sign-up`
   - After Sign In URL: `/`
   - After Sign Up URL: `/`
4. Copy your publishable key and secret key to the `.env.local` file:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
CLERK_SECRET_KEY=your_secret_key
```

## Database Setup

The application uses Prisma with SQLite by default, but can be configured to use other databases.

### Default SQLite Setup

No additional configuration is needed for development. The `db:setup` script creates and initializes the SQLite database.

### Using PostgreSQL, MySQL, or Other Databases

1. Update the `DATABASE_URL` in your `.env.local` file:

```
# For PostgreSQL
DATABASE_URL="postgresql://username:password@localhost:5432/health_insights"

# For MySQL
DATABASE_URL="mysql://username:password@localhost:3306/health_insights"
```

2. Run the database setup script to apply migrations:

```bash
npm run db:setup
```

See [DATABASE_SETUP.md](DATABASE_SETUP.md) for more detailed database instructions.

## API Keys and Models

### Google Gemini AI

1. Get a Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add it to your `.env.local` file:

```
GEMINI_API_KEY=your_gemini_api_key
```

### Configuration in Admin Console

Once the application is running, you can use the admin console at `/admin` to:

1. Configure system prompts
2. Set API keys
3. Choose fallback models
4. Configure output limits

## Development Workflow

### Folder Structure

- `/app`: Next.js application and API routes
- `/components`: Reusable React components
- `/lib`: Utilities and services
- `/public`: Static assets
- `/prisma`: Database schema and migrations

### Key Components

- **File Upload**: Handles PDF, image, and Excel/CSV uploads
- **Chat Interface**: Allows users to interact with the AI
- **Health Analyzer**: Specialized view for lab report analysis
- **Health Trends**: Compare health metrics over time

### Adding a New Feature

1. Create required components in `/components`
2. Add a new page in `/app` if needed
3. Implement API endpoints in `/app/api` if required
4. Update services in `/lib/services` if needed
5. Add tests for the new feature

## Testing

### Running Tests

```bash
npm run test
```

### Manual Testing

1. Test file uploads with various file types
2. Test chat functionality with different queries
3. Test authentication flow
4. Test database operations

## Deployment

### Vercel Deployment

1. Push your repository to GitHub
2. Connect your repository to Vercel
3. Configure environment variables in the Vercel dashboard
4. Set up the production database

### Environment Variables for Production

Ensure the following environment variables are set in your production environment:

- `DATABASE_URL`: Production database connection string
- `GEMINI_API_KEY`: Google Gemini API key
- `CLERK_SECRET_KEY`: Clerk secret key
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk publishable key
- `ADMIN_PASSWORD`: Password for admin access

## Troubleshooting

### Common Issues

#### API Key Issues

If you see "API key not configured" errors:
1. Check that `GEMINI_API_KEY` is set in `.env.local`
2. Ensure the API key is valid and has the necessary permissions
3. Check if you've reached API rate limits

#### Database Connection Issues

If you see database-related errors:
1. Verify `DATABASE_URL` is correct
2. Ensure database server is running
3. Check database permissions
4. Run `npm run db:setup` to initialize the database

#### File Upload Issues

If file uploads fail:
1. Check file size (max 10MB)
2. Verify file type is supported
3. Check browser console for errors
4. Check server logs for error details

### Getting Help

If you encounter problems not covered in this guide:
1. Check the project issues on GitHub
2. Create a new issue with detailed information about your problem
3. Include error logs and steps to reproduce the issue
