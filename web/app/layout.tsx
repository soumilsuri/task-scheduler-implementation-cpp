import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jb-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CFS Scheduler Visualizer',
  description:
    'Interactive browser-based simulation of the Linux Completely Fair Scheduler (CFS). Configure processes, run the algorithm step-by-step, and visualize vruntime, queue state, and the Gantt timeline.',
  keywords: ['CFS', 'scheduler', 'Linux', 'vruntime', 'process scheduling', 'visualizer'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
