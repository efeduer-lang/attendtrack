'use client';

import React, { useState, ReactNode } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { ToastProvider } from './ToastContext';

export default function AppLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ToastProvider>
      <div className="app-container">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="app-main">
          <Topbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
          <main className="page-content">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
