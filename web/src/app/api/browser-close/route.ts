import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Log browser close event for debugging (optional)
    console.log('Browser close detected via beacon:', body);
    
    // You could store this in a database or use it for analytics
    // For now, we just acknowledge the request
    
    return NextResponse.json({ success: true });
  } catch (error) {
    // Don't fail if beacon fails - it's just for reliability
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
