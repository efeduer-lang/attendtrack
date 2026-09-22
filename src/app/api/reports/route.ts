import { NextResponse } from 'next/server';
import { DataService } from '@/lib/dataService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const classId = searchParams.get('classId') || undefined;

    if (!month) {
      return NextResponse.json(
        { success: false, error: 'Month parameter is required (format: YYYY-MM).' },
        { status: 400 }
      );
    }

    const reportRows = await DataService.getMonthlyReport(month, classId);
    return NextResponse.json({
      success: true,
      data: reportRows,
      meta: {
        month,
        classId: classId || 'all',
        totalRecords: reportRows.length,
      },
    });
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : 'Failed to generate report';
    return NextResponse.json({ success: false, error: errMessage }, { status: 500 });
  }
}
