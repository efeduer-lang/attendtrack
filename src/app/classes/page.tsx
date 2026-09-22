'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { School, Plus, Trash2, Search, Users, AlertCircle } from 'lucide-react';
import { SchoolClass } from '@/types';
import { useToast } from '@/components/ToastContext';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';

interface ClassWithCount extends SchoolClass {
  studentCount?: number;
}

export default function ClassesPage() {
  const { showToast } = useToast();
  const [classes, setClasses] = useState<ClassWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Form State
  const [className, setClassName] = useState('');
  const [teacher, setTeacher] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState<ClassWithCount | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/classes');
      const data = await res.json();
      if (data.success && data.data) {
        setClasses(data.data);
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Failed to load classes.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim() || !teacher.trim()) {
      showToast('error', 'Please provide both class name and teacher name.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: className, teacher }),
      });
      const data = await res.json();

      if (data.success) {
        showToast('success', `Class "${className}" created successfully.`);
        setClassName('');
        setTeacher('');
        fetchClasses();
      } else {
        showToast('error', data.error || 'Failed to create class.');
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeleteClass = (c: ClassWithCount) => {
    if ((c.studentCount || 0) > 0) {
      showToast(
        'error',
        `Cannot delete "${c.name}". It still has ${c.studentCount} enrolled student(s). Reassign them first.`
      );
      return;
    }
    setClassToDelete(c);
    setDeleteModalOpen(true);
  };

  const handleDeleteClass = async () => {
    if (!classToDelete) return;

    try {
      setDeleting(true);
      const res = await fetch(`/api/classes/${classToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        showToast('success', `Class "${classToDelete.name}" deleted.`);
        setDeleteModalOpen(false);
        setClassToDelete(null);
        fetchClasses();
      } else {
        showToast('error', data.error || 'Failed to delete class.');
      }
    } catch (err) {
      console.error(err);
      showToast('error', 'Failed to delete class.');
    } finally {
      setDeleting(false);
    }
  };

  const filteredClasses = classes.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.teacher.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Create Class Card */}
      <div className="card-section">
        <div className="section-header">
          <div>
            <h3 className="section-title">Register New Class</h3>
            <p className="section-subtitle">Create classrooms and assign faculty members</p>
          </div>
        </div>

        <form onSubmit={handleCreateClass} className="form-grid">
          <div className="form-group">
            <label className="form-label" htmlFor="className">
              Class Name
            </label>
            <input
              id="className"
              type="text"
              className="form-control"
              placeholder="e.g. Grade 10 - Blue, JSS 1A"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="classTeacher">
              Assigned Teacher
            </label>
            <input
              id="classTeacher"
              type="text"
              className="form-control"
              placeholder="e.g. Mr. David Adebayo"
              value={teacher}
              onChange={(e) => setTeacher(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{ width: '100%' }}
            >
              <Plus size={16} />
              <span>{submitting ? 'Creating...' : 'Add Class'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Classes List Table */}
      <div className="card-section">
        <div className="section-header">
          <div>
            <h3 className="section-title">Registered Classes ({classes.length})</h3>
            <p className="section-subtitle">Manage existing classrooms and view enrollment</p>
          </div>

          <div style={{ position: 'relative', minWidth: 260 }}>
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
              placeholder="Search classes or teachers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {filteredClasses.length === 0 && !loading ? (
          <EmptyState
            icon={School}
            title={search ? "No Classes Matching Search" : "No Classes Registered Yet"}
            description={
              search
                ? "Try searching for a different class name or clear your search term."
                : "Get started by adding your first classroom using the registration form above."
            }
          />
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>#</th>
                  <th>Class Name</th>
                  <th>Class Teacher</th>
                  <th>Students Enrolled</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredClasses.map((item, index) => (
                  <tr key={item.id}>
                    <td style={{ color: 'var(--text-muted)' }}>{index + 1}</td>
                    <td style={{ fontWeight: 600 }}>{item.name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{item.teacher}</td>
                    <td>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '3px 10px',
                          borderRadius: 'var(--radius-full)',
                          background: '#f1f5f9',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                        }}
                      >
                        <Users size={13} />
                        {item.studentCount || 0}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => confirmDeleteClass(item)}
                        title="Delete Class"
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

      {/* Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteClass}
        title="Delete Class"
        message={
          <div>
            <p>
              Are you sure you want to delete class <strong>{classToDelete?.name}</strong>?
            </p>
            <p style={{ marginTop: 8, fontSize: '0.825rem', color: '#991b1b' }}>
              This action cannot be undone.
            </p>
          </div>
        }
        confirmText="Delete Class"
        isDanger={true}
        isLoading={deleting}
      />
    </div>
  );
}
