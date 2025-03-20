# Database Setup Guide

This guide explains how to set up and configure the database for the Health Insights AI application.

## Automatic Setup

The easiest way to set up the database is to use our automated setup script:

```bash
npm run db:setup
```

This script will:

1. Generate the Prisma client
2. Check if the database exists
3. Create the database if needed
4. Run any pending migrations

## Manual Setup

If you prefer to set up the database manually, follow these steps:

### 1. Configure Database Connection

By default, the application uses SQLite for simplicity, but you can use any database supported by Prisma (PostgreSQL, MySQL, SQL Server, etc.).

Set your database connection in the `.env` file:

```text
# For SQLite (default)
DATABASE_URL="file:./prisma/dev.db"

# For PostgreSQL
# DATABASE_URL="postgresql://username:password@localhost:5432/health_insights?schema=public"

# For MySQL
# DATABASE_URL="mysql://username:password@localhost:3306/health_insights"
```

### 2. Generate Prisma Client

Generate the Prisma client to interact with your database:

```bash
npx prisma generate
```

### 3. Create and Apply Migrations

Run this command to create and apply database migrations:

```bash
npx prisma migrate dev --name init
```

For production environments, use:

```bash
npx prisma migrate deploy
```

## Database Schema

The application uses the following database schema:

- **User**: User accounts and profiles
- **Account**: OAuth accounts connected to users
- **Session**: User sessions
- **VerificationToken**: Tokens for email verification
- **Chat**: Chat conversations with message history
- **HealthReport**: Health reports and extracted metrics

## Checking Database Status

You can check the database status in the admin console at `/admin`. The admin console shows:

- Connection status
- Database type
- Pending migrations
- Data statistics

## Troubleshooting

### Common Issues

#### Database File Not Found

If you're using SQLite and see the error "Database file not found", run:

```bash
npm run db:setup
```

#### Migration Failed

If migration fails, try:

```bash
npx prisma migrate reset
npx prisma migrate dev
```

Note: This will delete all data in the database.

#### Prisma Client Not Generated

If you see errors about missing Prisma client, run:

```bash
npx prisma generate
```

### Database Backups

For SQLite, simply copy the `prisma/dev.db` file to create a backup.

For production databases, use your database provider's backup tools.

## Production Deployment

For production deployments:

1. Set the `DATABASE_URL` environment variable in your hosting environment
1. Run the database migrations during deployment:

```bash
npx prisma migrate deploy
```

1. Ensure the database user has the necessary permissions

## Data Persistence

- **Development**: SQLite database in `prisma/dev.db`
- **Production**: Configure with `DATABASE_URL` environment variable
- **Fallback**: If database operations fail, the app will fall back to storing chat data in local JSON files in the `.chats` directory

## More Information

For more details about Prisma, refer to the [Prisma Documentation](https://www.prisma.io/docs/).
