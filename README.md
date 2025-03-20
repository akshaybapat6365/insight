# Health Insights AI

A simple AI-powered health data analysis tool built with Next.js, Vercel AI, and Google's Gemini API.

## Features

- AI chat interface for answering health questions
- File upload for analyzing health reports and bloodwork
- **Health Trends** for tracking changes in lab results over time
- **Chat History** for saving and retrieving past conversations
- Google Sign-In authentication for personalized experience
- Admin console for changing system prompts and settings
- Minimal, dark-themed UI focused on health insights
- Multi-format upload support (PDF, JPEG, CSV, Excel)
- Educational health explanations with medical terminology
- Responsive design for desktop and mobile devices

## New: Health Trends Analyzer

The Health Trends feature allows users to:

- Upload multiple lab reports from different time periods
- Track changes in specific health metrics over time
- Identify patterns and trends in health data
- Receive educational insights about health metric changes
- Understand how health metrics move in and out of normal ranges

## Deployment

### Prerequisites

- Google Gemini API key (get from https://ai.google.dev/)
- Google OAuth credentials (create from https://console.cloud.google.com/)
- Vercel account

### Steps to Deploy

1. Fork or clone this repository
2. Push to your own GitHub repository
3. Connect to Vercel and create a new project from your repository
4. Set the following environment variables in Vercel:
   - `GEMINI_API_KEY`: Your Google Gemini API key
   - `NEXTAUTH_URL`: Your production URL (e.g., https://your-app.vercel.app)
   - `NEXTAUTH_SECRET`: A secure random string for session encryption
   - `GOOGLE_CLIENT_ID`: Your Google OAuth client ID
   - `GOOGLE_CLIENT_SECRET`: Your Google OAuth client secret
   - `ADMIN_PASSWORD`: A password to access the admin console (example: "healthadmin2024")
5. Deploy the project
6. Access the admin console at: `https://your-app-url.vercel.app/admin?key=yourpassword`

### Deploying via Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# OR specify environment variables during deployment
vercel --prod --env GEMINI_API_KEY=your_api_key
```

## Local Development

```bash
# Clone the repository
git clone [repository-url]
cd my-health-insights-app

# Install dependencies
npm install

# Create .env.local with required variables
echo "GEMINI_API_KEY=your_gemini_api_key" > .env.local
echo "ADMIN_PASSWORD=your_admin_password" >> .env.local

# Run the development server
npm run dev
```

## Technology Stack

- **Frontend**: Next.js 15.x, TypeScript, Tailwind CSS
- **AI Integration**: Google Gemini API, Vercel AI SDK
- **Authentication**: NextAuth.js with Google provider
- **Database**: SQLite with Prisma ORM
- **Styling**: Custom health-themed UI components

## Usage

### Chat Interface

The main interface allows users to:
- Ask health-related questions directly
- Upload health reports for AI analysis
- Receive educational explanations about health metrics and terminology
- Save chat history for future reference when signed in

### Health Trends Analyzer

The Health Trends Analyzer enables users to:

- Upload and manage multiple lab reports in one place
- Select specific health metrics for trend analysis
- Compare changes in metrics across different time periods
- Receive AI-generated insights about health metric patterns

### Chat History

The Chat History feature enables users to:
- View all previous conversations with the AI assistant
- Continue past conversations where they left off
- Delete unwanted chat threads
- Organize health conversations by topic or date

### Admin Console

Access the admin console to:
- Configure the system prompt that guides the AI behavior
- Update API keys without redeploying the application

## Disclaimer

Health Insights AI provides educational information only, not medical advice. Always consult healthcare professionals for medical decisions.

## License

[MIT License](LICENSE)

## Acknowledgements

- [Google Gemini API](https://ai.google.dev/)
- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vercel](https://vercel.com/)
- [AI SDK](https://ai.dev/)

## Database Setup

The application uses SQLite with Prisma ORM for data persistence:

```bash
# Initialize Prisma
npx prisma init

# After modifying the schema, push changes to the database
npx prisma db push

# Generate Prisma client
npx prisma generate

# Open Prisma Studio to view/edit data
npx prisma studio
```

## Authentication Configuration

To configure Google authentication:

1. Create a Google Cloud project and OAuth credentials at https://console.cloud.google.com
2. Add the following to your `.env.local` file:
   ```
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   NEXTAUTH_URL=http://localhost:3000 (or your deployment URL)
   NEXTAUTH_SECRET=your_random_secret_key
   ```
