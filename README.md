# Health Insights AI

A simple AI-powered health data analysis tool built with Next.js, Vercel AI, and Google's Gemini API.

## Features

- AI chat interface for answering health questions
- File upload for analyzing health reports and bloodwork
- Admin console for changing system prompts and settings
- Minimal, dark-themed UI focused on health insights
- Multi-format upload support (PDF, JPEG, CSV, Excel)
- Educational health explanations with medical terminology
- Responsive design for desktop and mobile devices

## Deployment

### Prerequisites

- Google Gemini API key (get from https://ai.google.dev/)
- Vercel account

### Steps to Deploy

1. Fork or clone this repository
2. Push to your own GitHub repository
3. Connect to Vercel and create a new project from your repository
4. Set the following environment variables in Vercel:
   - `GEMINI_API_KEY`: Your Google Gemini API key
   - `ADMIN_PASSWORD`: A password to access the admin console (example: "healthadmin2024")
5. Deploy the project
6. Access the admin console at: `https://your-app-url.vercel.app/admin?key=yourpassword`

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
- **Styling**: Custom health-themed UI components

## Usage

### Chat Interface

The main interface allows users to:
- Ask health-related questions directly
- Upload health reports for AI analysis
- Receive educational explanations about health metrics and terminology

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
