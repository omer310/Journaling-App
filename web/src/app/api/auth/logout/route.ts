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
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing user ID' },
        { status: 400 }
      );
    }

    // Get current session
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

    // Log the logout event for security monitoring
    await supabase
      .from('security_events')
      .insert({
        user_id: userId,
        event_type: 'LOGOUT',
        details: {
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          user_agent: request.headers.get('user-agent'),
          session_duration: sessionStart ? Date.now() - new Date(sessionStart).getTime() : null,
          logout_reason: 'user_initiated'
        },
        severity: 'LOW'
      });

    // Invalidate the session in our tracking table
    await supabase
      .from('user_sessions')
      .update({ 
        active: false,
        ended_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('session_id', session.access_token);

    // Sign out the user
    const { error: signOutError } = await supabase.auth.signOut();
    
    if (signOutError) {
      console.error('Sign out error:', signOutError);
      return NextResponse.json(
        { error: 'Failed to sign out' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 