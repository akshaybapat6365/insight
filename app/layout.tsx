import './globals.css';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import { Metadata } from 'next';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Health Insights AI | Analyze Your Health Data',
  description: 'Upload your bloodwork and health reports for AI-powered insights and explanations.',
  icons: {
    icon: [
      {
        url: '/favicon.svg',
        type: 'image/svg+xml',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`${inter.className} min-h-screen bg-black text-white`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
