import { NextResponse } from 'next/server';
import { DataService } from '@/lib/dataService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const classId = searchParams.get('classId') || undefined;

    const students = await DataService.getStudents({ search, classId });
    const classes = await DataService.getClasses();
    const classMap = new Map(classes.map((c) => [c.id, c.name]));

    const enrichedStudents = students.map((s) => ({
      ...s,
      className: classMap.get(s.classId) || 'Unassigned',
    }));

    return NextResponse.json({ success: true, data: enrichedStudents });
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : 'Failed to fetch students';
    return NextResponse.json({ success: false, error: errMessage }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studentId, name, classId, gender } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Student name is required.' }, { status: 400 });
    }

    if (!studentId || typeof studentId !== 'string' || !studentId.trim()) {
      return NextResponse.json({ success: false, error: 'Student ID is required.' }, { status: 400 });
    }

    if (!classId || typeof classId !== 'string') {
      return NextResponse.json({ success: false, error: 'Valid class must be selected.' }, { status: 400 });
    }

    const created = await DataService.createStudent({ studentId, name, classId, gender });
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : 'Failed to create student';
    return NextResponse.json({ success: false, error: errMessage }, { status: 400 });
  }
}
