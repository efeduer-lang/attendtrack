'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  Database,
  RotateCcw,
  Trash2,
  Download,
  CheckCircle2,
  Server,
} from 'lucide-react';
import { SchoolSettings } from '@/types';
import { useToast } from '@/components/ToastContext';
import Modal from '@/components/Modal';

export default function SettingsPage() {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<SchoolSettings>({
    schoolName: '',
    academicSession: '',
    term: '',
    updatedAt: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Maintenance Modals
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setSettings(data.data);
        }
      })
      .catch((err) => {
        console.error(err);
        showToast('error', 'Failed to load settings.');
      })
      .finally(() => setLoading(false));
  }, [showToast]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolName: settings.schoolName,
          academicSession: settings.academicSession,
          term: settings.term,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast('success', 'School settings saved successfully.');
        setSettings(data.data);
      } else {
        showToast('error', data.error || 'Failed to update settings.');
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Error updating settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleDemoAction = async (action: 'reset' | 'clear') => {
    try {
      setMaintenanceLoading(true);
      const res = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();

      if (data.success) {
        showToast('success', data.message);
        setResetModalOpen(false);
        setClearModalOpen(false);
        fetch('/api/settings')
          .then((r) => r.json())
          .then((s) => {
            if (s.success && s.data) setSettings(s.data);
          })
          .catch(() => {});
      } else {
        showToast('error', data.error || 'Operation failed.');
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Operation failed.');
    } finally {
      setMaintenanceLoading(false);
    }
  };

  const handleExportBackup = async () => {
    try {
      const [clsRes, stuRes, attRes, setRes] = await Promise.all([
        fetch('/api/classes').then((r) => r.json()),
        fetch('/api/students').then((r) => r.json()),
        fetch('/api/attendance').then((r) => r.json()),
        fetch('/api/settings').then((r) => r.json()),
      ]);

      const backup = {
        exportedAt: new Date().toISOString(),
        settings: setRes.data,
        classes: clsRes.data,
        students: stuRes.data,
        attendance: attRes.data,
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendtrack-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      showToast('success', 'Backup JSON downloaded successfully.');
    } catch (err) {
      console.error(err);
      showToast('error', 'Failed to generate system backup.');
    }
  };

  return (
    <div>
      {/* School Information Settings */}
      <div className="card-section">
        <div className="section-header">
          <div>
            <h3 className="section-title">School Information</h3>
            <p className="section-subtitle">
              Configure institution name, academic calendar, and term settings
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveSettings} className="form-grid">
          <div className="form-group">
            <label className="form-label" htmlFor="schoolNameInput">
              Institution / School Name
            </label>
            <input
              id="schoolNameInput"
              type="text"
              className="form-control"
              placeholder="e.g. School Attendance System"
              value={settings.schoolName}
              onChange={(e) => setSettings({ ...settings, schoolName: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="sessionInput">
              Academic Session
            </label>
            <input
              id="sessionInput"
              type="text"
              className="form-control"
              placeholder="e.g. 2026/2027"
              value={settings.academicSession}
              onChange={(e) => setSettings({ ...settings, academicSession: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="termInput">
              Current Academic Term / Semester
            </label>
            <input
              id="termInput"
              type="text"
              className="form-control"
              placeholder="e.g. First Term / Fall Semester"
              value={settings.term}
              onChange={(e) => setSettings({ ...settings, term: e.target.value })}
              disabled={loading}
            />
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || loading}
            >
              <Save size={16} />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Backend & Database Readiness Panel */}
      <div className="card-section">
        <div className="section-header">
          <div>
            <h3 className="section-title">Backend Architecture & Database</h3>
            <p className="section-subtitle">System status and persistent data management</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 24 }}>
          <div style={{ padding: 18, border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: '#f8fafc' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, color: 'var(--primary)' }}>
              <Server size={20} />
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>API Service Layer</h4>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Next.js App Router REST API endpoints active at <code>/api/*</code>. Supports asynchronous JSON responses, validation, and HTTP status codes.
            </p>
          </div>

          <div style={{ padding: 18, border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: '#f8fafc' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, color: 'var(--success)' }}>
              <Database size={20} />
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Database Ready (Prisma)</h4>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Included schema in <code>prisma/schema.prisma</code> ready for PostgreSQL, SQLite, MySQL, or Supabase connection.
            </p>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 20 }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 14 }}>Data Operations</h4>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              className="btn btn-outline btn-sm"
              onClick={handleExportBackup}
            >
              <Download size={15} />
              <span>Export Full Backup (JSON)</span>
            </button>

            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setResetModalOpen(true)}
            >
              <RotateCcw size={15} />
              <span>Reset with Sample Demo Data</span>
            </button>

            <button
              className="btn btn-danger btn-sm"
              onClick={() => setClearModalOpen(true)}
            >
              <Trash2 size={15} />
              <span>Clear All Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        onConfirm={() => handleDemoAction('reset')}
        title="Reset to Sample Demo Data"
        message="This will repopulate the database with sample classes, students, and attendance records. Any custom changes will be overwritten."
        confirmText="Confirm Reset"
        isLoading={maintenanceLoading}
      />

      {/* Clear Confirmation Modal */}
      <Modal
        isOpen={clearModalOpen}
        onClose={() => setClearModalOpen(false)}
        onConfirm={() => handleDemoAction('clear')}
        title="Clear All System Records"
        message="Are you sure you want to erase all classes, students, and attendance records? This cannot be undone."
        confirmText="Erase All Data"
        isDanger={true}
        isLoading={maintenanceLoading}
      />
    </div>
  );
}
