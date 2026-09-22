import { NextResponse } from 'next/server';
import { DataService } from '@/lib/dataService';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cls = await DataService.getClassById(id);
    if (!cls) {
      return NextResponse.json({ success: false, error: 'Class not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: cls });
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : 'Error fetching class';
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
    const updated = await DataService.updateClass(id, body);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Class not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : 'Error updating class';
    return NextResponse.json({ success: false, error: errMessage }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await DataService.deleteClass(id);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.message }, { status: 400 });
    }
    return NextResponse.json({ success: true, message: 'Class deleted successfully' });
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : 'Error deleting class';
    return NextResponse.json({ success: false, error: errMessage }, { status: 500 });
  }
}
