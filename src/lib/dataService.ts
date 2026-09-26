import fs from 'fs/promises';
import path from 'path';
import {
  SchoolClass,
  Student,
  AttendanceRecord,
  SchoolSettings,
  DashboardStats,
  ClassAttendanceSummary,
  MonthlyReportRow,
} from '@/types';

interface DatabaseSchema {
  classes: SchoolClass[];
  students: Student[];
  attendance: AttendanceRecord[];
  settings: SchoolSettings;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'attendance_db.json');

// Clean default initial settings for fresh system start
const DEFAULT_SETTINGS: SchoolSettings = {
  schoolName: 'School Attendance System',
  academicSession: '2026/2027',
  term: 'First Term',
  updatedAt: new Date().toISOString(),
};

// Optional sample seed data used only if user explicitly clicks "Reset to Sample Demo Data" in Settings
const SAMPLE_DEMO_CLASSES: SchoolClass[] = [
  {
    id: 'cls-1',
    name: 'Grade 10 - Blue',
    teacher: 'Mr. David Adebayo',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cls-2',
    name: 'Grade 10 - Gold',
    teacher: 'Mrs. Sarah Jenkins',
    createdAt: new Date().toISOString(),
  },
];

const SAMPLE_DEMO_STUDENTS: Student[] = [
  {
    id: 'stu-1',
    studentId: 'STU-101',
    name: 'Alexander Wright',
    classId: 'cls-1',
    gender: 'Male',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'stu-2',
    studentId: 'STU-102',
    name: 'Amara Okafor',
    classId: 'cls-1',
    gender: 'Female',
    createdAt: new Date().toISOString(),
  },
];

// Helper to get formatted today string: YYYY-MM-DD
function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Ensure database file exists (starts fresh with 0 dummy records)
async function ensureDatabase(): Promise<DatabaseSchema> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const content = await fs.readFile(DB_FILE, 'utf-8');
    const parsed = JSON.parse(content) as DatabaseSchema;
    return parsed;
  } catch {
    const freshData: DatabaseSchema = {
      classes: [],
      students: [],
      attendance: [],
      settings: DEFAULT_SETTINGS,
    };
    await fs.writeFile(DB_FILE, JSON.stringify(freshData, null, 2), 'utf-8');
    return freshData;
  }
}

// Save database
async function saveDatabase(data: DatabaseSchema): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// =====================================
// DATA SERVICE API
// =====================================

export const DataService = {
  // --- Classes ---
  async getClasses(): Promise<SchoolClass[]> {
    const db = await ensureDatabase();
    return db.classes;
  },

  async getClassById(id: string): Promise<SchoolClass | null> {
    const db = await ensureDatabase();
    return db.classes.find((c) => c.id === id) || null;
  },

  async createClass(input: { name: string; teacher: string }): Promise<SchoolClass> {
    const db = await ensureDatabase();
    const newClass: SchoolClass = {
      id: `cls-${Date.now()}`,
      name: input.name.trim(),
      teacher: input.teacher.trim(),
      createdAt: new Date().toISOString(),
    };
    db.classes.push(newClass);
    await saveDatabase(db);
    return newClass;
  },

  async updateClass(id: string, input: { name?: string; teacher?: string }): Promise<SchoolClass | null> {
    const db = await ensureDatabase();
    const index = db.classes.findIndex((c) => c.id === id);
    if (index === -1) return null;

    db.classes[index] = {
      ...db.classes[index],
      ...(input.name ? { name: input.name.trim() } : {}),
      ...(input.teacher ? { teacher: input.teacher.trim() } : {}),
    };
    await saveDatabase(db);
    return db.classes[index];
  },

  async deleteClass(id: string): Promise<{ success: boolean; message?: string }> {
    const db = await ensureDatabase();
    // Rule: Cannot delete class if it has students
    const hasStudents = db.students.some((s) => s.classId === id);
    if (hasStudents) {
      return {
        success: false,
        message: 'Cannot delete a class that has enrolled students. Reassign or remove students first.',
      };
    }

    db.classes = db.classes.filter((c) => c.id !== id);
    // Remove any orphaned attendance records for that class
    db.attendance = db.attendance.filter((a) => a.classId !== id);
    await saveDatabase(db);
    return { success: true };
  },

  // --- Students ---
  async getStudents(filters?: { classId?: string; search?: string }): Promise<Student[]> {
    const db = await ensureDatabase();
    let result = db.students;

    if (filters?.classId && filters.classId !== 'all') {
      result = result.filter((s) => s.classId === filters.classId);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (s) => s.name.toLowerCase().includes(q) || s.studentId.toLowerCase().includes(q)
      );
    }

    return result;
  },

  async getStudentById(id: string): Promise<Student | null> {
    const db = await ensureDatabase();
    return db.students.find((s) => s.id === id) || null;
  },

  async createStudent(input: {
    studentId: string;
    name: string;
    classId: string;
    gender?: 'Male' | 'Female' | 'Other';
  }): Promise<Student> {
    const db = await ensureDatabase();

    // Verify class exists
    const classExists = db.classes.some((c) => c.id === input.classId);
    if (!classExists) {
      throw new Error('Selected class does not exist.');
    }

    // Check duplicate studentId
    const duplicate = db.students.some(
      (s) => s.studentId.toLowerCase() === input.studentId.trim().toLowerCase()
    );
    if (duplicate) {
      throw new Error(`Student ID "${input.studentId}" is already assigned to another student.`);
    }

    const newStudent: Student = {
      id: `stu-${Date.now()}`,
      studentId: input.studentId.trim().toUpperCase(),
      name: input.name.trim(),
      classId: input.classId,
      gender: input.gender || 'Other',
      createdAt: new Date().toISOString(),
    };

    db.students.push(newStudent);
    await saveDatabase(db);
    return newStudent;
  },

  async updateStudent(
    id: string,
    input: { studentId?: string; name?: string; classId?: string; gender?: 'Male' | 'Female' | 'Other' }
  ): Promise<Student | null> {
    const db = await ensureDatabase();
    const index = db.students.findIndex((s) => s.id === id);
    if (index === -1) return null;

    if (input.studentId) {
      const duplicate = db.students.some(
        (s) => s.id !== id && s.studentId.toLowerCase() === input.studentId!.trim().toLowerCase()
      );
      if (duplicate) {
        throw new Error(`Student ID "${input.studentId}" is already assigned.`);
      }
    }

    db.students[index] = {
      ...db.students[index],
      ...(input.studentId ? { studentId: input.studentId.trim().toUpperCase() } : {}),
      ...(input.name ? { name: input.name.trim() } : {}),
      ...(input.classId ? { classId: input.classId } : {}),
      ...(input.gender ? { gender: input.gender } : {}),
    };

    await saveDatabase(db);
    return db.students[index];
  },

  async deleteStudent(id: string): Promise<boolean> {
    const db = await ensureDatabase();
    db.students = db.students.filter((s) => s.id !== id);
    // Cascade remove attendance records
    db.attendance = db.attendance.filter((a) => a.studentId !== id);
    await saveDatabase(db);
    return true;
  },

  // --- Attendance ---
  async getAttendance(filters?: { date?: string; classId?: string; month?: string }): Promise<AttendanceRecord[]> {
    const db = await ensureDatabase();
    let result = db.attendance;

    if (filters?.date) {
      result = result.filter((a) => a.date === filters.date);
    }

    if (filters?.classId && filters.classId !== 'all') {
      result = result.filter((a) => a.classId === filters.classId);
    }

    if (filters?.month) {
      result = result.filter((a) => a.date.startsWith(filters.month!));
    }

    return result;
  },

  async saveBulkAttendance(input: {
    date: string;
    classId: string;
    records: Array<{ studentId: string; status: AttendanceRecord['status'] }>;
  }): Promise<{ savedCount: number }> {
    const db = await ensureDatabase();
    const { date, classId, records } = input;

    // Filter out existing records for this class & date to perform upsert
    const studentIdsInBatch = new Set(records.map((r) => r.studentId));
    db.attendance = db.attendance.filter(
      (a) => !(a.date === date && a.classId === classId && studentIdsInBatch.has(a.studentId))
    );

    const now = new Date().toISOString();
    const newRecords: AttendanceRecord[] = records.map((rec) => ({
      id: `att-${Date.now()}-${rec.studentId}`,
      studentId: rec.studentId,
      classId: classId,
      date: date,
      status: rec.status,
      createdAt: now,
    }));

    db.attendance.push(...newRecords);
    await saveDatabase(db);
    return { savedCount: newRecords.length };
  },

  // --- Dashboard Stats ---
  async getDashboardStats(): Promise<{
    stats: DashboardStats;
    classSummaries: ClassAttendanceSummary[];
  }> {
    const db = await ensureDatabase();
    const today = getTodayString();

    const todayAttendance = db.attendance.filter((a) => a.date === today);
    const presentToday = todayAttendance.filter((a) => a.status === 'Present').length;
    const absentToday = todayAttendance.filter((a) => a.status === 'Absent').length;

    const totalStudents = db.students.length;
    const totalClasses = db.classes.length;
    const attendanceRateToday =
      totalStudents > 0 ? Math.round((presentToday / totalStudents) * 100) : 0;

    const classSummaries: ClassAttendanceSummary[] = db.classes.map((c) => {
      const classStudents = db.students.filter((s) => s.classId === c.id);
      const classTodayRecords = todayAttendance.filter((a) => a.classId === c.id);
      const present = classTodayRecords.filter((a) => a.status === 'Present').length;
      const absent = classTodayRecords.filter((a) => a.status === 'Absent').length;
      const percentage =
        classStudents.length > 0 ? Math.round((present / classStudents.length) * 100) : 0;

      return {
        classId: c.id,
        className: c.name,
        teacher: c.teacher,
        totalStudents: classStudents.length,
        presentToday: present,
        absentToday: absent,
        percentage,
      };
    });

    return {
      stats: {
        totalStudents,
        totalClasses,
        presentToday,
        absentToday,
        attendanceRateToday,
        todayDate: today,
      },
      classSummaries,
    };
  },

  // --- Monthly Reports ---
  async getMonthlyReport(month: string, classId?: string): Promise<MonthlyReportRow[]> {
    const db = await ensureDatabase();

    let targetStudents = db.students;
    if (classId && classId !== 'all') {
      targetStudents = targetStudents.filter((s) => s.classId === classId);
    }

    const classMap = new Map(db.classes.map((c) => [c.id, c.name]));

    const rows: MonthlyReportRow[] = targetStudents.map((student) => {
      const studentRecords = db.attendance.filter(
        (a) => a.studentId === student.id && a.date.startsWith(month)
      );

      const presentDays = studentRecords.filter((a) => a.status === 'Present').length;
      const absentDays = studentRecords.filter((a) => a.status === 'Absent').length;
      const totalDays = studentRecords.length;
      const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

      return {
        studentId: student.id,
        studentCode: student.studentId,
        studentName: student.name,
        className: classMap.get(student.classId) || 'Unassigned',
        presentDays,
        absentDays,
        totalDays,
        percentage,
      };
    });

    return rows;
  },

  // --- Settings ---
  async getSettings(): Promise<SchoolSettings> {
    const db = await ensureDatabase();
    return db.settings;
  },

  async updateSettings(input: Partial<SchoolSettings>): Promise<SchoolSettings> {
    const db = await ensureDatabase();
    db.settings = {
      ...db.settings,
      ...input,
      updatedAt: new Date().toISOString(),
    };
    await saveDatabase(db);
    return db.settings;
  },

  // --- Maintenance & Demo Reset ---
  async resetToDemoData(): Promise<void> {
    const demoData: DatabaseSchema = {
      classes: SAMPLE_DEMO_CLASSES,
      students: SAMPLE_DEMO_STUDENTS,
      attendance: [],
      settings: DEFAULT_SETTINGS,
    };
    await saveDatabase(demoData);
  },

  async clearAllData(): Promise<void> {
    const emptyData: DatabaseSchema = {
      classes: [],
      students: [],
      attendance: [],
      settings: DEFAULT_SETTINGS,
    };
    await saveDatabase(emptyData);
  },
};
