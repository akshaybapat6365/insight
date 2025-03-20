# CONFIDENTIAL: API Keys and Credentials

## IMPORTANT: DO NOT COMMIT THIS FILE TO VERSION CONTROL

This file contains sensitive information required for the Health Insights AI application. Keep this information secure and only share with authorized team members.

## Environment Variables

For local development, these values should be added to your `.env.local` file. For production, add them to your Vercel project environment variables.

### Database Connection

```text
DATABASE_URL="file:./dev.db"  # Local SQLite database
# For production:
# DATABASE_URL="postgresql://username:password@localhost:5432/health_insights"
```

Note: The local development uses a SQLite database, but production should use a PostgreSQL database hosted on a cloud provider.

### Google AI API

```text
GEMINI_API_KEY="your-gemini-api-key"
```

The application uses Google's Gemini models to generate health insights and explanations.

### Clerk Authentication

```text
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your-clerk-publishable-key"
CLERK_SECRET_KEY="your-clerk-secret-key"
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/"
```

### NextAuth Configuration (Deprecated)

```text
NEXTAUTH_URL="https://insight-esidcwh3n-akshay-bapats-projects.vercel.app"
NEXTAUTH_SECRET="your-nextauth-secret"
```

## Vercel Deployment

**Project URL:** <https://health-insights-ai.vercel.app>
**Dashboard:** <https://vercel.com/akshay-bapats-projects/insight>

## Development Notes

1. The local development server uses port 3000 by default.
2. The production build is configured to use the port specified by the `PORT` environment variable.
3. The Prisma database schema is managed through the `prisma/schema.prisma` file.
4. The application was migrated from NextAuth to Clerk for authentication.

## Useful Commands

```bash
# Initialize database
npx prisma generate
npx prisma db push

# Deploy to Vercel
./deploy.sh

# View database with Prisma Studio
npx prisma studio
```

## Security Recommendations

1. Rotate API keys regularly
2. Use Vercel's environment variable encryption
3. Never hardcode credentials in application code
4. Keep this file secure and separate from version control
