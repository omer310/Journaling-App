import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );
    
    // Get the request body
    const { userId, sessionStart } = await request.json();
    
    if (!userId || !sessionStart) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'No valid session found' },
        { status: 401 }
      );
    }

    // Verify the session belongs to the claimed user
    if (session.user.id !== userId) {
      return NextResponse.json(
        { error: 'Session user mismatch' },
        { status: 403 }
      );
    }

    // Check if session is too old (24 hours max)
    const sessionAge = Date.now() - new Date(sessionStart).getTime();
    const maxSessionAge = 24 * 60 * 60 * 1000; // 24 hours
    
    if (sessionAge > maxSessionAge) {
      return NextResponse.json(
        { error: 'Session too old' },
        { status: 401 }
      );
    }

    // Check for suspicious activity (multiple sessions, location changes, etc.)
    const { data: recentSessions, error: sessionsError } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    if (recentSessions && recentSessions.length > 5) {
      // Too many sessions in 24 hours - potential security issue
      return NextResponse.json(
        { error: 'Suspicious activity detected' },
        { status: 403 }
      );
    }

    // Update session activity
    await supabase
      .from('user_sessions')
      .upsert({
        user_id: userId,
        session_id: session.access_token,
        last_activity: new Date().toISOString(),
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent'),
      });

    return NextResponse.json({ 
      valid: true,
      sessionAge,
      lastActivity: new Date().toISOString()
    });

  } catch (error) {
    console.error('Session validation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 