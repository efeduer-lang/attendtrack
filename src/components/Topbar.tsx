'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, Calendar, ShieldCheck } from 'lucide-react';
import { SchoolSettings } from '@/types';

interface TopbarProps {
  onToggleSidebar: () => void;
}

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Dashboard', subtitle: 'Real-time school attendance overview' },
  '/classes': { title: 'Classes Management', subtitle: 'Register and organize classrooms' },
  '/students': { title: 'Students Directory', subtitle: 'Manage student records and enrollments' },
  '/attendance': { title: 'Mark Attendance', subtitle: 'Record and track daily classroom attendance' },
  '/reports': { title: 'Attendance Reports', subtitle: 'Analyze monthly attendance statistics and export records' },
  '/settings': { title: 'System Settings', subtitle: 'Configure academic session and manage data' },
};

export default function Topbar({ onToggleSidebar }: TopbarProps) {
  const pathname = usePathname();
  const [settings, setSettings] = useState<SchoolSettings | null>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data) {
          setSettings(res.data);
        }
      })
      .catch(() => {});
  }, [pathname]);

  const currentMeta = pageTitles[pathname] || {
    title: 'Attendance System',
    subtitle: 'School Management',
  };

  return (
    <header className="app-topbar">
      <div className="topbar-left">
        <button
          className="mobile-menu-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
        >
          <Menu size={22} />
        </button>
        <div>
          <h1 className="page-title">{currentMeta.title}</h1>
          <p className="page-subtitle">{currentMeta.subtitle}</p>
        </div>
      </div>

      <div className="topbar-right">
        <div className="session-badge">
          <Calendar size={14} />
          <span>{settings?.academicSession || '2026/2027'}</span>
        </div>

        <div className="user-profile">
          <div className="avatar">
            <ShieldCheck size={16} />
          </div>
          <div className="user-info">
            <span className="user-name">Staff Portal</span>
            <span className="user-role">{settings?.schoolName || 'School Attendance System'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
