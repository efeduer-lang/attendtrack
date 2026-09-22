'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  FileBarChart,
  Download,
  Calendar,
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  School,
} from 'lucide-react';
import { SchoolClass, MonthlyReportRow } from '@/types';
import { useToast } from '@/components/ToastContext';
import EmptyState from '@/components/EmptyState';

function getCurrentMonthString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export default function ReportsPage() {
  const { showToast } = useToast();
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthString());
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [reportRows, setReportRows] = useState<MonthlyReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Fetch classes for filter dropdown
  useEffect(() => {
    fetch('/api/classes')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setClasses(data.data);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const generateReport = useCallback(async () => {
    if (!selectedMonth) {
      showToast('error', 'Please select a month to generate report.');
      return;
    }

    try {
      setLoading(true);
      const url = `/api/reports?month=${selectedMonth}&classId=${selectedClassId}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.success && data.data) {
        setReportRows(data.data);
        showToast('success', `Report generated for ${selectedMonth} (${data.data.length} records).`);
      } else {
        showToast('error', data.error || 'Failed to generate report.');
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Error generating report.');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedClassId, showToast]);

  // Initial load
  useEffect(() => {
    generateReport();
  }, [generateReport]);

  // Export CSV
  const handleExportCSV = () => {
    if (reportRows.length === 0) {
      showToast('error', 'No attendance data available to export.');
      return;
    }

    let csvContent = 'Student ID,Student Name,Class,Present Days,Absent Days,Total Recorded Days,Attendance %\n';

    reportRows.forEach((r) => {
      const escapedName = `"${r.studentName.replace(/"/g, '""')}"`;
      const escapedClass = `"${r.className.replace(/"/g, '""')}"`;
      csvContent += `${r.studentCode},${escapedName},${escapedClass},${r.presentDays},${r.absentDays},${r.totalDays},${r.percentage}%\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance-report-${selectedMonth}${selectedClassId !== 'all' ? `-${selectedClassId}` : ''}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    showToast('success', 'CSV report downloaded successfully.');
  };

  const filteredRows = reportRows.filter(
    (r) =>
      r.studentName.toLowerCase().includes(search.toLowerCase()) ||
      r.studentCode.toLowerCase().includes(search.toLowerCase()) ||
      r.className.toLowerCase().includes(search.toLowerCase())
  );

  // Compute stats
  const totalStudentsInReport = reportRows.length;
  const avgAttendance =
    totalStudentsInReport > 0
      ? Math.round(reportRows.reduce((acc, r) => acc + r.percentage, 0) / totalStudentsInReport)
      : 0;
  const highAttendanceCount = reportRows.filter((r) => r.percentage >= 80).length;
  const lowAttendanceCount = reportRows.filter((r) => r.percentage < 60 && r.totalDays > 0).length;

  return (
    <div>
      {/* Filters & Export Header */}
      <div className="card-section">
        <div className="section-header">
          <div>
            <h3 className="section-title">Attendance Reports & Analytics</h3>
            <p className="section-subtitle">Generate monthly roll summaries and download reports</p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              onClick={generateReport}
              disabled={loading}
            >
              <FileBarChart size={16} />
              <span>{loading ? 'Generating...' : 'Generate Report'}</span>
            </button>

            <button
              className="btn btn-secondary"
              onClick={handleExportCSV}
              disabled={reportRows.length === 0}
            >
              <Download size={16} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <div className="attendance-header-controls">
          <div className="attendance-filters">
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={14} />
                <span>Report Month</span>
              </label>
              <input
                type="month"
                className="form-control"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Users size={14} />
                <span>Class Filter</span>
              </label>
              <select
                className="form-control"
                style={{ minWidth: 200 }}
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
              >
                <option value="all">All Classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search inside report */}
          <div style={{ position: 'relative', minWidth: 240 }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-dim)',
              }}
            />
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: 36 }}
              placeholder="Search in report..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Summary Stat Cards */}
      {reportRows.length > 0 && (
        <div className="stats-grid">
          <div className="stat-card primary">
            <div className="stat-info">
              <p>Students in Report</p>
              <h3>{totalStudentsInReport}</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Analyzed enrolled students</span>
            </div>
            <div className="stat-icon-wrapper primary">
              <Users size={24} />
            </div>
          </div>

          <div className="stat-card success">
            <div className="stat-info">
              <p>Average Attendance</p>
              <h3>{avgAttendance}%</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Classroom overall average</span>
            </div>
            <div className="stat-icon-wrapper success">
              <CheckCircle2 size={24} />
            </div>
          </div>

          <div className="stat-card warning">
            <div className="stat-info">
              <p>High Attendance (≥80%)</p>
              <h3>{highAttendanceCount}</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Consistent attenders</span>
            </div>
            <div className="stat-icon-wrapper warning">
              <CheckCircle2 size={24} />
            </div>
          </div>

          <div className="stat-card danger">
            <div className="stat-info">
              <p>At Risk (&lt;60%)</p>
              <h3>{lowAttendanceCount}</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Require intervention</span>
            </div>
            <div className="stat-icon-wrapper danger">
              <AlertTriangle size={24} />
            </div>
          </div>
        </div>
      )}

      {/* Report Table */}
      <div className="card-section">
        <div className="section-header">
          <div>
            <h3 className="section-title">Monthly Roll Summary ({filteredRows.length})</h3>
            <p className="section-subtitle">
              Attendance records for {selectedMonth}
            </p>
          </div>
        </div>

        {classes.length === 0 && !loading ? (
          <EmptyState
            icon={School}
            title="No Attendance Data Available"
            description="Create classrooms and enroll students to start generating detailed monthly attendance analytics."
            action={
              <Link href="/classes" className="btn btn-primary btn-sm">
                Create First Class
              </Link>
            }
          />
        ) : filteredRows.length === 0 && !loading ? (
          <EmptyState
            icon={FileBarChart}
            title="No Records Found"
            description="No attendance records match the selected month and class filter."
          />
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 120 }}>Student ID</th>
                  <th>Student Name</th>
                  <th>Class</th>
                  <th style={{ textAlign: 'center' }}>Present Days</th>
                  <th style={{ textAlign: 'center' }}>Absent Days</th>
                  <th style={{ textAlign: 'center' }}>Total Days</th>
                  <th style={{ minWidth: 180 }}>Attendance Rate</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => {
                  const rateType =
                    row.percentage >= 80 ? 'high' : row.percentage >= 60 ? 'medium' : 'low';

                  return (
                    <tr key={row.studentId}>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>
                          {row.studentCode}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{row.studentName}</td>
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-sm)',
                            background: '#f1f5f9',
                            fontSize: '0.825rem',
                          }}
                        >
                          {row.className}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="status-pill present">{row.presentDays}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="status-pill absent">{row.absentDays}</span>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)' }}>
                        {row.totalDays}
                      </td>
                      <td>
                        <div className="progress-bar-container">
                          <div className="progress-track">
                            <div
                              className={`progress-fill ${rateType}`}
                              style={{ width: `${row.percentage}%` }}
                            />
                          </div>
                          <span
                            className={`status-pill ${rateType}`}
                            style={{ minWidth: 50, justifyContent: 'center' }}
                          >
                            {row.percentage}%
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
