import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Parse request body once and handle both regular and security logout
    let body: any = {};
    let logoutReason = 'user_initiated';
    let sessionFingerprint = null;
    let userId = null;
    let sessionStart = null;
    
    try {
      body = await request.json();
      
      if (body.type === 'security_logout') {
        // Security logout via beacon
        logoutReason = body.reason || 'security_logout';
        sessionFingerprint = body.sessionFingerprint;
        console.log(`SECURITY: Logout triggered - ${logoutReason}`);
      } else {
        // Regular logout
        userId = body.userId;
        sessionStart = body.sessionStart;
      }
    } catch (error) {
      // If body parsing fails, treat as regular logout without body data
      console.log('No body data provided for logout');
    }

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
    
    // For security logout, get user from session since we don't have userId in body
    if (body.type === 'security_logout') {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        userId = session.user.id;
      }
    }
    
    // We'll check for userId again after getting session data

    // Get current session (needed for both security and regular logout)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    // For security logout, we might not have a session if it was already cleared
    if (body.type !== 'security_logout' && (sessionError || !session)) {
      return NextResponse.json(
        { error: 'No valid session found' },
        { status: 401 }
      );
    }
    
    // Update userId from session if we have one (for security logout)
    if (session?.user && !userId) {
      userId = session.user.id;
    }

    // Final check for userId
    if (!userId) {
      // For security logout, we can still proceed to clear session even without userId
      if (body.type === 'security_logout') {
        console.log('Security logout proceeding without userId - clearing session anyway');
      } else {
        return NextResponse.json(
          { error: 'Missing user ID' },
          { status: 400 }
        );
      }
    }

    // Verify the session belongs to the claimed user (if we have both)
    if (session?.user && userId && session.user.id !== userId) {
      return NextResponse.json(
        { error: 'Session user mismatch' },
        { status: 403 }
      );
    }

    // Log the logout event for security monitoring (only if we have userId)
    if (userId) {
      await supabase
        .from('security_events')
        .insert({
          user_id: userId,
          event_type: 'LOGOUT',
          details: {
            ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
            user_agent: request.headers.get('user-agent'),
            session_duration: sessionStart ? Date.now() - new Date(sessionStart).getTime() : null,
            logout_reason: logoutReason,
            session_fingerprint: sessionFingerprint
          },
          severity: logoutReason.includes('security') ? 'MEDIUM' : 'LOW'
        });

      // Invalidate the session in our tracking table
      if (session?.access_token) {
        await supabase
          .from('user_sessions')
          .update({ 
            active: false,
            ended_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('session_id', session.access_token);
      }
    }

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