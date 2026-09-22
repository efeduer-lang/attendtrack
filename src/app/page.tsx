'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  School,
  CheckCircle2,
  XCircle,
  CalendarCheck,
  UserPlus,
  PlusCircle,
  FileBarChart,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import StatCard from '@/components/StatCard';
import EmptyState from '@/components/EmptyState';
import { DashboardStats, ClassAttendanceSummary } from '@/types';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [schoolName, setSchoolName] = useState<string>('School Attendance System');
  const [classSummaries, setClassSummaries] = useState<ClassAttendanceSummary[]>([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [dashRes, setRes] = await Promise.all([
        fetch('/api/dashboard').then((r) => r.json()),
        fetch('/api/settings').then((r) => r.json()).catch(() => null),
      ]);

      if (dashRes.success && dashRes.data) {
        setStats(dashRes.data.stats);
        setClassSummaries(dashRes.data.classSummaries || []);
      }
      if (setRes?.success && setRes?.data?.schoolName) {
        setSchoolName(setRes.data.schoolName);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <div>
      {/* Top Header Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Daily Attendance Overview
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Live status for {stats?.todayDate || 'today'}
          </p>
        </div>
        <button
          className="btn btn-outline btn-sm"
          onClick={fetchDashboardData}
          disabled={loading}
          title="Refresh statistics"
        >
          <RefreshCw size={15} className={loading ? 'spin-anim' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Fresh System Onboarding Banner (Shown when no classes are configured yet) */}
      {!loading && stats && stats.totalClasses === 0 && (
        <div className="welcome-banner">
          <div className="welcome-content">
            <div className="welcome-badge">Fresh Setup Ready</div>
            <h3>Welcome to {schoolName}</h3>
            <p>
              Your attendance management system is clean, configured, and ready for use. Follow these three quick steps to get started:
            </p>
            <div className="setup-steps">
              <div className="step-item">
                <span className="step-number">1</span>
                <div>
                  <strong>Create Classrooms</strong>
                  <p>Define grade levels and assign teachers.</p>
                </div>
              </div>
              <div className="step-arrow">→</div>
              <div className="step-item">
                <span className="step-number">2</span>
                <div>
                  <strong>Enroll Students</strong>
                  <p>Register student profiles and assign them to classes.</p>
                </div>
              </div>
              <div className="step-arrow">→</div>
              <div className="step-item">
                <span className="step-number">3</span>
                <div>
                  <strong>Record Attendance</strong>
                  <p>Perform rapid daily roll calls and generate reports.</p>
                </div>
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <Link href="/classes" className="btn btn-primary">
                <PlusCircle size={16} />
                <span>Get Started: Create First Class</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="stats-grid">
        <StatCard
          title="Total Students"
          value={loading ? '...' : stats?.totalStudents ?? 0}
          icon={Users}
          variant="primary"
          subtext={stats && stats.totalStudents > 0 ? "Active enrollment" : "No students enrolled"}
        />
        <StatCard
          title="Total Classes"
          value={loading ? '...' : stats?.totalClasses ?? 0}
          icon={School}
          variant="warning"
          subtext={stats && stats.totalClasses > 0 ? "Configured classrooms" : "No classrooms added"}
        />
        <StatCard
          title="Present Today"
          value={loading ? '...' : stats?.presentToday ?? 0}
          icon={CheckCircle2}
          variant="success"
          subtext={stats && stats.totalStudents > 0 ? `${stats.attendanceRateToday}% attendance rate` : "No attendance recorded"}
        />
        <StatCard
          title="Absent Today"
          value={loading ? '...' : stats?.absentToday ?? 0}
          icon={XCircle}
          variant="danger"
          subtext={stats && stats.totalStudents > 0 ? (stats.absentToday > 0 ? `${stats.absentToday} students absent` : "Full attendance") : "No records yet"}
        />
      </div>

      {/* Quick Actions */}
      <div className="card-section">
        <div className="section-header">
          <div>
            <h3 className="section-title">Quick Actions</h3>
            <p className="section-subtitle">Common administrative tasks</p>
          </div>
        </div>

        <div className="quick-actions-grid">
          <Link href="/attendance" className="quick-action-card">
            <div className="action-icon">
              <CalendarCheck size={20} />
            </div>
            <div>
              <h4>Mark Attendance</h4>
              <p>Record or update today's student roll call</p>
            </div>
          </Link>

          <Link href="/students" className="quick-action-card">
            <div className="action-icon">
              <UserPlus size={20} />
            </div>
            <div>
              <h4>Add Student</h4>
              <p>Register a new student into a class</p>
            </div>
          </Link>

          <Link href="/classes" className="quick-action-card">
            <div className="action-icon">
              <PlusCircle size={20} />
            </div>
            <div>
              <h4>Add Class</h4>
              <p>Create a classroom and assign a teacher</p>
            </div>
          </Link>

          <Link href="/reports" className="quick-action-card">
            <div className="action-icon">
              <FileBarChart size={20} />
            </div>
            <div>
              <h4>View Reports</h4>
              <p>Analyze monthly summaries and export CSV</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Class Attendance Breakdown Table */}
      <div className="card-section">
        <div className="section-header">
          <div>
            <h3 className="section-title">Class Attendance Today</h3>
            <p className="section-subtitle">Daily breakdown by classroom and attendance rate</p>
          </div>
          <Link href="/reports" className="btn btn-outline btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span>Detailed Reports</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {classSummaries.length === 0 && !loading ? (
          <EmptyState
            icon={School}
            title="No Classes Registered Yet"
            description="Start by registering your first classroom to begin monitoring daily attendance."
            action={
              <Link href="/classes" className="btn btn-primary btn-sm">
                Create Class
              </Link>
            }
          />
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Teacher</th>
                  <th>Total Enrolled</th>
                  <th>Present</th>
                  <th>Absent</th>
                  <th style={{ minWidth: 180 }}>Attendance Rate</th>
                </tr>
              </thead>
              <tbody>
                {classSummaries.map((item) => {
                  const rateType =
                    item.percentage >= 80 ? 'high' : item.percentage >= 60 ? 'medium' : 'low';

                  return (
                    <tr key={item.classId}>
                      <td style={{ fontWeight: 600 }}>{item.className}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{item.teacher}</td>
                      <td>{item.totalStudents}</td>
                      <td>
                        <span className="status-pill present">
                          <CheckCircle2 size={13} />
                          {item.presentToday}
                        </span>
                      </td>
                      <td>
                        <span className="status-pill absent">
                          <XCircle size={13} />
                          {item.absentToday}
                        </span>
                      </td>
                      <td>
                        <div className="progress-bar-container">
                          <div className="progress-track">
                            <div
                              className={`progress-fill ${rateType}`}
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                          <span className={`status-pill ${rateType}`} style={{ minWidth: 50, justifyContent: 'center' }}>
                            {item.percentage}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
