'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Users, UserPlus, Trash2, Search, Filter, AlertCircle, School } from 'lucide-react';
import { Student, SchoolClass } from '@/types';
import { useToast } from '@/components/ToastContext';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';

interface EnrichedStudent extends Student {
  className?: string;
}

export default function StudentsPage() {
  const { showToast } = useToast();
  const [students, setStudents] = useState<EnrichedStudent[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('all');

  // Form State
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [classId, setClassId] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [submitting, setSubmitting] = useState(false);

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<EnrichedStudent | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchClasses = useCallback(async () => {
    try {
      const res = await fetch('/api/classes');
      const data = await res.json();
      if (data.success && data.data) {
        setClasses(data.data);
      }
    } catch (err) {
      console.error('Failed to load classes:', err);
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/students');
      const data = await res.json();
      if (data.success && data.data) {
        setStudents(data.data);
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Failed to load students.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchClasses();
    fetchStudents();
  }, [fetchClasses, fetchStudents]);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !studentId.trim() || !classId) {
      showToast('error', 'Please fill in all required fields.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          studentId,
          classId,
          gender,
        }),
      });
      const data = await res.json();

      if (data.success) {
        showToast('success', `Student "${name}" registered successfully.`);
        setName('');
        setStudentId('');
        fetchStudents();
      } else {
        showToast('error', data.error || 'Failed to register student.');
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (s: EnrichedStudent) => {
    setStudentToDelete(s);
    setDeleteModalOpen(true);
  };

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;

    try {
      setDeleting(true);
      const res = await fetch(`/api/students/${studentToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        showToast('success', `Student "${studentToDelete.name}" removed.`);
        setDeleteModalOpen(false);
        setStudentToDelete(null);
        fetchStudents();
      } else {
        showToast('error', data.error || 'Failed to delete student.');
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Failed to delete student.');
    } finally {
      setDeleting(false);
    }
  };

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.studentId.toLowerCase().includes(search.toLowerCase());
    const matchesClass =
      selectedClassFilter === 'all' || s.classId === selectedClassFilter;
    return matchesSearch && matchesClass;
  });

  return (
    <div>
      {/* Add Student Section */}
      <div className="card-section">
        <div className="section-header">
          <div>
            <h3 className="section-title">Register New Student</h3>
            <p className="section-subtitle">Enroll students and assign them to a classroom</p>
          </div>
        </div>

        {classes.length === 0 && !loading && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              padding: '14px 18px',
              borderRadius: 'var(--radius-md)',
              background: '#fef3c7',
              border: '1px solid #fde68a',
              marginBottom: 20,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#92400e' }}>
              <AlertCircle size={20} />
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                No classrooms registered yet. You must create at least one classroom before enrolling students.
              </span>
            </div>
            <Link href="/classes" className="btn btn-primary btn-sm">
              <School size={15} />
              <span>Create First Class</span>
            </Link>
          </div>
        )}

        <form onSubmit={handleCreateStudent} className="form-grid">
          <div className="form-group">
            <label className="form-label" htmlFor="studentName">
              Full Name *
            </label>
            <input
              id="studentName"
              type="text"
              className="form-control"
              placeholder="e.g. John Doe, Fatima Musa"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={classes.length === 0 || submitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="studentIdInput">
              Student ID *
            </label>
            <input
              id="studentIdInput"
              type="text"
              className="form-control"
              placeholder="e.g. STU-001"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              required
              disabled={classes.length === 0 || submitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="studentClassSelect">
              Class Assignment *
            </label>
            <select
              id="studentClassSelect"
              className="form-control"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              required
              disabled={classes.length === 0 || submitting}
            >
              <option value="">
                {classes.length === 0 ? 'No classrooms available' : 'Select Classroom'}
              </option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.teacher})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="studentGenderSelect">
              Gender
            </label>
            <select
              id="studentGenderSelect"
              className="form-control"
              value={gender}
              onChange={(e) => setGender(e.target.value as 'Male' | 'Female' | 'Other')}
              disabled={classes.length === 0 || submitting}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={classes.length === 0 || submitting}
              title={classes.length === 0 ? 'Please create a classroom first' : 'Register student'}
            >
              <UserPlus size={16} />
              <span>{submitting ? 'Registering...' : 'Add Student'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Student Directory Table */}
      <div className="card-section">
        <div className="section-header">
          <div>
            <h3 className="section-title">Students Directory ({filteredStudents.length})</h3>
            <p className="section-subtitle">Search, filter, and manage enrolled students</p>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Class Filter Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Filter size={16} style={{ color: 'var(--text-muted)' }} />
              <select
                className="form-control"
                style={{ minWidth: 170 }}
                value={selectedClassFilter}
                onChange={(e) => setSelectedClassFilter(e.target.value)}
              >
                <option value="all">All Classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input */}
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
                placeholder="Search by name or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {filteredStudents.length === 0 && !loading ? (
          <EmptyState
            icon={Users}
            title={students.length === 0 ? "No Students Registered Yet" : "No Students Matching Filter"}
            description={
              students.length === 0
                ? "Get started by enrolling your first student using the registration form above."
                : "No students matched your active search query or class filter."
            }
          />
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Full Name</th>
                  <th>Class</th>
                  <th>Gender</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>
                        {s.studentId}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: '#eff6ff',
                            color: '#2563eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                          }}
                        >
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600 }}>{s.name}</span>
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: 'var(--radius-sm)',
                          background: '#f8fafc',
                          border: '1px solid var(--border-color)',
                          fontSize: '0.85rem',
                          fontWeight: 500,
                        }}
                      >
                        {s.className || 'Unassigned'}
                      </span>
                    </td>
                    <td>
                      <span className="gender-badge">{s.gender || 'Other'}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => confirmDelete(s)}
                        title="Delete Student"
                      >
                        <Trash2 size={14} />
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteStudent}
        title="Delete Student Record"
        message={
          <div>
            <p>
              Are you sure you want to delete <strong>{studentToDelete?.name}</strong> ({studentToDelete?.studentId})?
            </p>
            <p style={{ marginTop: 8, fontSize: '0.825rem', color: '#991b1b' }}>
              All attendance records associated with this student will also be removed.
            </p>
          </div>
        }
        confirmText="Delete Student"
        isDanger={true}
        isLoading={deleting}
      />
    </div>
  );
}
