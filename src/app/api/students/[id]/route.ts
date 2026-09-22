import { NextResponse } from 'next/server';
import { DataService } from '@/lib/dataService';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const student = await DataService.getStudentById(id);
    if (!student) {
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: student });
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : 'Error fetching student';
    return NextResponse.json({ success: false, error: errMessage }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updated = await DataService.updateStudent(id, body);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : 'Error updating student';
    return NextResponse.json({ success: false, error: errMessage }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = await DataService.deleteStudent(id);
    if (!success) {
      return NextResponse.json({ success: false, error: 'Failed to delete student' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Student deleted successfully' });
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : 'Error deleting student';
    return NextResponse.json({ success: false, error: errMessage }, { status: 500 });
  }
}
