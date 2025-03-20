# Health Insights AI

An AI-powered health data analysis tool built with Next.js, Clerk authentication, and Google's Gemini AI.

![Health Insights AI](/public/screenshot.png)

## Features

- 🧠 AI chat interface for answering health questions
- 📊 Upload health reports and lab results for AI analysis
- 📈 **Health Trends** for tracking changes in lab results over time
- 💉 **Lab Analyzer** for detailed bloodwork and test result analysis
- 💬 **Chat History** for saving and retrieving past conversations
- 🔐 Clerk user authentication for secure, personalized experience
- ⚙️ Admin console for system configuration and API key management
- 🌙 Elegant, dark-themed UI focused on readability and usability
- 📄 Multi-format upload support (PDF, JPEG, CSV, Excel, TXT)
- 🏥 Educational health explanations with simplified medical terminology
- 📱 Responsive design for desktop, tablet, and mobile devices

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Google Gemini API key (get from [Google AI Studio](https://makersuite.google.com/app/apikey))
- Clerk account for authentication (sign up at [clerk.dev](https://clerk.dev))

### Quick Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/health-insights-ai.git
cd health-insights-ai

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys and settings

# Set up the database
npm run db:setup

# Start development server
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000)

## In-Depth Documentation

- [Implementation Guide](IMPLEMENTATION_GUIDE.md) - Complete setup and development guide
- [Database Setup](DATABASE_SETUP.md) - Database configuration and migration instructions
- [Authentication](AUTHENTICATION.md) - Clerk authentication setup and configuration
- [Developer Documentation](DEVELOPER_DOCUMENTATION_2025-03-20.md) - Technical architecture and code organization

## Using the Application

### Chat Interface

The main interface allows users to:
- Ask health-related questions directly to the AI
- Upload health reports for AI analysis
- Receive educational explanations about health metrics

### Health Analysis Features

#### Lab Analyzer
Upload bloodwork or other lab reports to get a detailed analysis of your health metrics, including:
- Explanation of each biomarker and its significance
- Visual indicators for values outside normal ranges
- Educational context about body systems and health implications
- Personalized insights based on your specific values

#### Health Trends
Track changes in your health metrics over time:
- Upload multiple reports from different dates
- Select specific biomarkers to compare
- Visualize trends and changes
- Understand the significance of changing health metrics

### Chat History

When signed in, the app saves your conversation history:
- View all previous conversations with the AI assistant
- Continue past conversations where you left off
- Delete unwanted chat threads
- Access insights from previous analyses

### Admin Console

Access the admin console at `/admin` to:
- Configure the system prompt that guides the AI behavior
- Update API keys without redeploying the application
- Set fallback models and output parameters
- Monitor system status and API usage

## Environment Variables

Key environment variables for configuration:

```
# Authentication with Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Admin Access
ADMIN_PASSWORD=your_admin_password
```

See [.env.example](.env.example) for a complete list of configuration options.

## Deployment

### Deploying to Vercel

This app is optimized for deployment on Vercel:

1. Push your code to a GitHub repository
2. Import your repository in the Vercel dashboard
3. Configure environment variables
4. Deploy

### Database Options

- Development: SQLite (default)
- Production: PostgreSQL recommended (set via `DATABASE_URL`)

## Technology Stack

- **Frontend**: Next.js 14+, React 18+, TypeScript
- **Authentication**: Clerk
- **Database**: Prisma ORM with SQLite/PostgreSQL
- **Styling**: Tailwind CSS with custom health-themed components
- **AI**: Google Gemini API, AI SDK
- **File Processing**: Server-side PDF and image processing

## Disclaimer

Health Insights AI provides educational information only, not medical advice. Always consult qualified healthcare professionals for medical decisions.

## License

[MIT License](LICENSE)

## Contributing

Contributions are welcome! Please check out our [contribution guidelines](CONTRIBUTING.md) for details.

## Acknowledgements

- [Google Gemini API](https://ai.google.dev/)
- [Next.js](https://nextjs.org/)
- [Clerk Authentication](https://clerk.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Prisma](https://www.prisma.io/)
- [Vercel](https://vercel.com/)
