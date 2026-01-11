import type { Metadata } from 'next';
import './globals.css';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export const metadata: Metadata = {
  title: 'Agent Factory Console',
  description: 'Single pane of glass dashboard for multi-agent AI development',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        <SessionProvider>
          <DashboardLayout>{children}</DashboardLayout>
        </SessionProvider>
      </body>
    </html>
  );
}
