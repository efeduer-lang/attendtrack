import type { Metadata } from 'next';
import React from 'react';
import './globals.css';
import AppLayout from '@/components/AppLayout';

export const metadata: Metadata = {
  title: 'AttendTrack - School Attendance Management System',
  description: 'Full-stack school attendance tracking system with real-time reports and analytics',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
