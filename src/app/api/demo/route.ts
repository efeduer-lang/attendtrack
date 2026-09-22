import { NextResponse } from 'next/server';
import { DataService } from '@/lib/dataService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'reset') {
      await DataService.resetToDemoData();
      try {
        await fetch('http://127.0.0.1:8000/api/demo/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'reset' }),
          signal: AbortSignal.timeout(600),
        });
      } catch {
        // Django backend offline, local database successfully reset
      }
      return NextResponse.json({
        success: true,
        message: 'Successfully reset database with sample classes, students, and attendance.',
      });
    }

    if (action === 'clear') {
      await DataService.clearAllData();
      try {
        await fetch('http://127.0.0.1:8000/api/demo/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'clear' }),
          signal: AbortSignal.timeout(600),
        });
      } catch {
        // Django backend offline, local database successfully cleared
      }
      return NextResponse.json({
        success: true,
        message: 'Successfully cleared all student, class, and attendance data.',
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action.' }, { status: 400 });
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : 'Demo operation failed';
    return NextResponse.json({ success: false, error: errMessage }, { status: 500 });
  }
}
