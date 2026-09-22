'use client';

import React, { ElementType, ReactNode } from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: ElementType;
  title: string;
  description: string;
  action?: ReactNode;
}

export default function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="empty-state">
      <Icon className="empty-icon" />
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: 6 }}>
        {title}
      </h3>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: 360, margin: '0 auto 18px' }}>
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
