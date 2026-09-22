import { NextResponse } from 'next/server';
import { DataService } from '@/lib/dataService';

export async function GET() {
  try {
    const classes = await DataService.getClasses();
    const students = await DataService.getStudents();

    const classesWithCount = classes.map((c) => ({
      ...c,
      studentCount: students.filter((s) => s.classId === c.id).length,
    }));

    return NextResponse.json({ success: true, data: classesWithCount });
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : 'Failed to fetch classes';
    return NextResponse.json({ success: false, error: errMessage }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, teacher } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Class name is required.' },
        { status: 400 }
      );
    }

    if (!teacher || typeof teacher !== 'string' || !teacher.trim()) {
      return NextResponse.json(
        { success: false, error: 'Teacher name is required.' },
        { status: 400 }
      );
    }

    const created = await DataService.createClass({ name, teacher });
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : 'Failed to create class';
    return NextResponse.json({ success: false, error: errMessage }, { status: 500 });
  }
}
