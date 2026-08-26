import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AutoBio AI | 20-Day English Fluency Platform',
  description: 'AI-driven autobiographical writing platform with deep linguistic analysis and portfolio tracking.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
