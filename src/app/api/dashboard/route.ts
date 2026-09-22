import { NextResponse } from 'next/server';
import { DataService } from '@/lib/dataService';

export async function GET() {
  try {
    const dashboardData = await DataService.getDashboardStats();
    return NextResponse.json({ success: true, data: dashboardData });
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : 'Failed to fetch dashboard data';
    return NextResponse.json({ success: false, error: errMessage }, { status: 500 });
  }
}
