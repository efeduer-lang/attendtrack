'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Save,
  CheckCheck,
  X,
  Calendar,
  Users,
  School,
} from 'lucide-react';
import { SchoolClass, Student, AttendanceStatus } from '@/types';
import { useToast } from '@/components/ToastContext';
import EmptyState from '@/components/EmptyState';

function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function AttendancePage() {
  const { showToast } = useToast();
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({});

  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load classes
  useEffect(() => {
    fetch('/api/classes')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setClasses(data.data);
          if (data.data.length > 0) {
            setSelectedClassId(data.data[0].id);
          }
        }
      })
      .catch((err) => console.error('Failed to load classes:', err))
      .finally(() => setLoadingClasses(false));
  }, []);

  // Fetch students & existing attendance for chosen class and date
  const loadClassAttendanceData = useCallback(async (classId: string, date: string) => {
    if (!classId) {
      setStudents([]);
      setAttendanceMap({});
      return;
    }

    try {
      setLoadingStudents(true);

      // 1. Fetch students for this class
      const stuRes = await fetch(`/api/students?classId=${classId}`);
      const stuData = await stuRes.json();
      const classStudents: Student[] = stuData.success ? stuData.data : [];
      setStudents(classStudents);

      // 2. Fetch any already recorded attendance for this class & date
      const attRes = await fetch(`/api/attendance?classId=${classId}&date=${date}`);
      const attData = await attRes.json();
      const existingRecords: Array<{ studentId: string; status: AttendanceStatus }> =
        attData.success ? attData.data : [];

      const map: Record<string, AttendanceStatus> = {};
      const existingMap = new Map(existingRecords.map((r) => [r.studentId, r.status]));

      classStudents.forEach((student) => {
        // Use existing recorded status, or default to 'Present'
        map[student.id] = existingMap.get(student.id) || 'Present';
      });

      setAttendanceMap(map);
    } catch (err) {
      console.error(err);
      showToast('error', 'Error loading attendance data.');
    } finally {
      setLoadingStudents(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (selectedClassId) {
      loadClassAttendanceData(selectedClassId, selectedDate);
    }
  }, [selectedClassId, selectedDate, loadClassAttendanceData]);

  // Status updates
  const setStudentStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const markAll = (status: AttendanceStatus) => {
    const updated: Record<string, AttendanceStatus> = {};
    students.forEach((s) => {
      updated[s.id] = status;
    });
    setAttendanceMap(updated);
    showToast('info', `Marked all students as ${status}.`);
  };

  // Save Attendance to Backend
  const handleSaveAttendance = async () => {
    if (!selectedClassId || !selectedDate) {
      showToast('error', 'Please select both a date and a classroom.');
      return;
    }

    if (students.length === 0) {
      showToast('error', 'There are no students in this class to record.');
      return;
    }

    try {
      setSaving(true);
      const records = students.map((s) => ({
        studentId: s.id,
        status: attendanceMap[s.id] || 'Present',
      }));

      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          classId: selectedClassId,
          records,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast('success', data.message || 'Attendance saved successfully!');
      } else {
        showToast('error', data.error || 'Failed to save attendance.');
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'An error occurred while saving attendance.');
    } finally {
      setSaving(false);
    }
  };

  // Calculate live tallies
  const presentCount = Object.values(attendanceMap).filter((s) => s === 'Present').length;
  const absentCount = Object.values(attendanceMap).filter((s) => s === 'Absent').length;

  return (
    <div>
      {/* Attendance Header Controls */}
      <div className="card-section" style={{ paddingBottom: 20 }}>
        <div className="section-header">
          <div>
            <h3 className="section-title">Mark Daily Attendance</h3>
            <p className="section-subtitle">Select date and class to log student attendance</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              className="btn btn-primary"
              onClick={handleSaveAttendance}
              disabled={saving || students.length === 0}
            >
              <Save size={16} />
              <span>{saving ? 'Saving...' : 'Save Attendance'}</span>
            </button>
          </div>
        </div>

        <div className="attendance-header-controls">
          <div className="attendance-filters">
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={14} />
                <span>Attendance Date</span>
              </label>
              <input
                type="date"
                className="form-control"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Users size={14} />
                <span>Select Class</span>
              </label>
              <select
                className="form-control"
                style={{ minWidth: 200 }}
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                disabled={loadingClasses}
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.teacher})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Bulk Actions & Tallies */}
          {students.length > 0 && (
            <div className="attendance-bulk-actions">
              <div className="attendance-tally">
                <span style={{ color: 'var(--text-muted)' }}>Class Total: {students.length}</span>
                <span style={{ color: 'var(--success)' }}>• Present: {presentCount}</span>
                <span style={{ color: 'var(--danger)' }}>• Absent: {absentCount}</span>
              </div>

              <button
                className="btn btn-outline btn-sm"
                onClick={() => markAll('Present')}
                title="Mark everyone present"
              >
                <CheckCheck size={14} style={{ color: 'var(--success)' }} />
                <span>All Present</span>
              </button>

              <button
                className="btn btn-outline btn-sm"
                onClick={() => markAll('Absent')}
                title="Mark everyone absent"
              >
                <X size={14} style={{ color: 'var(--danger)' }} />
                <span>All Absent</span>
              </button>
            </div>
          )}
        </div>

        {/* Student Roll Call Table */}
        {classes.length === 0 && !loadingClasses ? (
          <EmptyState
            icon={School}
            title="No Classes Configured Yet"
            description="You must register at least one classroom and enroll students before taking daily attendance."
            action={
              <Link href="/classes" className="btn btn-primary btn-sm">
                Create First Class
              </Link>
            }
          />
        ) : students.length === 0 && !loadingStudents ? (
          <EmptyState
            icon={Users}
            title="No Students in this Class"
            description="There are currently no students registered in this classroom. Enroll students to start taking roll calls."
            action={
              <Link href="/students" className="btn btn-primary btn-sm">
                Enroll Students
              </Link>
            }
          />
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>#</th>
                  <th style={{ width: 140 }}>Student ID</th>
                  <th>Student Full Name</th>
                  <th>Gender</th>
                  <th style={{ minWidth: 220, textAlign: 'right' }}>Attendance Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => {
                  const currentStatus = attendanceMap[student.id] || 'Present';
                  const isPresent = currentStatus === 'Present';

                  return (
                    <tr key={student.id}>
                      <td style={{ color: 'var(--text-muted)' }}>{index + 1}</td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>
                          {student.studentId}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{student.name}</td>
                      <td>
                        <span className="gender-badge">{student.gender || 'Other'}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="attendance-toggle">
                          <button
                            type="button"
                            className={`toggle-opt ${isPresent ? 'selected-present' : ''}`}
                            onClick={() => setStudentStatus(student.id, 'Present')}
                          >
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                              <CheckCircle2 size={13} />
                              Present
                            </span>
                          </button>
                          <button
                            type="button"
                            className={`toggle-opt ${!isPresent ? 'selected-absent' : ''}`}
                            onClick={() => setStudentStatus(student.id, 'Absent')}
                          >
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                              <XCircle size={13} />
                              Absent
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {students.length > 0 && (
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="btn btn-primary"
              onClick={handleSaveAttendance}
              disabled={saving}
              style={{ minWidth: 160 }}
            >
              <Save size={16} />
              <span>{saving ? 'Saving...' : 'Save Attendance'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
