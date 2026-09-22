export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Excused';

export interface SchoolClass {
  id: string;
  name: string;
  teacher: string;
  createdAt: string;
}

export interface Student {
  id: string;
  studentId: string; // e.g. "STU001"
  name: string;
  classId: string;
  gender: 'Male' | 'Female' | 'Other';
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  classId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  createdAt: string;
}

export interface SchoolSettings {
  schoolName: string;
  academicSession: string;
  term: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalClasses: number;
  presentToday: number;
  absentToday: number;
  attendanceRateToday: number;
  todayDate: string;
}

export interface ClassAttendanceSummary {
  classId: string;
  className: string;
  teacher: string;
  totalStudents: number;
  presentToday: number;
  absentToday: number;
  percentage: number;
}

export interface MonthlyReportRow {
  studentId: string;
  studentCode: string;
  studentName: string;
  className: string;
  presentDays: number;
  absentDays: number;
  totalDays: number;
  percentage: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
