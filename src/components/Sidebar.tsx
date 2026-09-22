'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  School,
  Users,
  CalendarCheck,
  BarChart3,
  Settings,
  GraduationCap,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/classes', label: 'Classes', icon: School },
  { href: '/students', label: 'Students', icon: Users },
  { href: '/attendance', label: 'Attendance', icon: CalendarCheck },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-icon-box">
            <GraduationCap size={24} />
          </div>
          <div>
            <div className="brand-title">AttendTrack</div>
            <div className="brand-subtitle">School Attendance</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="backend-indicator">
            <span className="backend-dot" />
            <span>Next.js REST API Connected</span>
          </div>
        </div>
      </aside>
    </>
  );
}
