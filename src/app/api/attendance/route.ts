import { NextResponse } from 'next/server';
import { DataService } from '@/lib/dataService';
import { AttendanceStatus } from '@/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || undefined;
    const classId = searchParams.get('classId') || undefined;
    const month = searchParams.get('month') || undefined;

    const records = await DataService.getAttendance({ date, classId, month });
    return NextResponse.json({ success: true, data: records });
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : 'Failed to fetch attendance';
    return NextResponse.json({ success: false, error: errMessage }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, classId, records } = body;

    if (!date || !classId || !Array.isArray(records)) {
      return NextResponse.json(
        { success: false, error: 'Date, classId, and an array of records are required.' },
        { status: 400 }
      );
    }

    // Validate records structure
    const validRecords = records.filter(
      (r): r is { studentId: string; status: AttendanceStatus } =>
        Boolean(r && r.studentId && ['Present', 'Absent', 'Late', 'Excused'].includes(r.status))
    );

    const result = await DataService.saveBulkAttendance({
      date,
      classId,
      records: validRecords,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully recorded attendance for ${result.savedCount} students.`,
      data: result,
    });
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : 'Failed to save attendance';
    return NextResponse.json({ success: false, error: errMessage }, { status: 500 });
  }
}
