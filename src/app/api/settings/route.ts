import { NextResponse } from 'next/server';
import { DataService } from '@/lib/dataService';

export async function GET() {
  try {
    const settings = await DataService.getSettings();
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : 'Failed to fetch settings';
    return NextResponse.json({ success: false, error: errMessage }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const updated = await DataService.updateSettings(body);
    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully.',
      data: updated,
    });
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : 'Failed to save settings';
    return NextResponse.json({ success: false, error: errMessage }, { status: 500 });
  }
}
