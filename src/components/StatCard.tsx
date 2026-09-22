'use client';

import React, { ElementType } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ElementType;
  variant?: 'primary' | 'success' | 'danger' | 'warning';
  subtext?: string;
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  variant = 'primary',
  subtext,
}: StatCardProps) {
  return (
    <div className={`stat-card ${variant}`}>
      <div className="stat-info">
        <p>{title}</p>
        <h3>{value}</h3>
        {subtext && (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{subtext}</span>
        )}
      </div>
      <div className={`stat-icon-wrapper ${variant}`}>
        <Icon size={24} />
      </div>
    </div>
  );
}
