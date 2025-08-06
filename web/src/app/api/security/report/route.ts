import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Get the security event data
    const eventData = await request.json();
    const { 
      eventType, 
      details, 
      severity = 'MEDIUM', 
      userId, 
      email 
    } = eventData;
    
    if (!eventType) {
      return NextResponse.json(
        { error: 'Missing event type' },
        { status: 400 }
      );
    }

    // Get IP address from headers
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';

    // Enhance the event details with server-side information
    const enhancedDetails = {
      ...details,
      ip_address: ipAddress,
      user_agent: request.headers.get('user-agent'),
      timestamp: new Date().toISOString(),
      server_side: true
    };

    // Insert the security event
    const { data: securityEvent, error: insertError } = await supabase
      .from('security_events')
      .insert({
        user_id: userId,
        email: email,
        event_type: eventType,
        details: enhancedDetails,
        severity: severity,
        timestamp: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting security event:', insertError);
      return NextResponse.json(
        { error: 'Failed to record security event' },
        { status: 500 }
      );
    }

    // Check if this event should trigger an alert
    const shouldAlert = severity === 'HIGH' || severity === 'CRITICAL';
    
    if (shouldAlert) {
      // Create a security alert
      await supabase
        .from('security_alerts')
        .insert({
          event_id: securityEvent.id,
          user_id: userId,
          email: email,
          alert_type: `${eventType}_${severity}`,
          details: enhancedDetails,
          severity: severity,
          created_at: new Date().toISOString()
        });

      // Here you could also:
      // - Send email notifications to admins
      // - Trigger webhooks to security monitoring systems
      // - Log to external security monitoring services
    }

    // Check for suspicious patterns
    const { data: recentEvents, error: recentError } = await supabase
      .from('security_events')
      .select('*')
      .eq('user_id', userId)
      .eq('event_type', eventType)
      .gte('timestamp', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
      .order('timestamp', { ascending: false });

    if (recentEvents && recentEvents.length > 10) {
      // Too many events of this type - potential attack
      console.warn(`Suspicious activity detected for user ${userId}: ${recentEvents.length} ${eventType} events in the last hour`);
      
      // Could trigger additional security measures here
    }

    return NextResponse.json({ 
      success: true,
      eventId: securityEvent.id,
      alertCreated: shouldAlert
    });

  } catch (error) {
    console.error('Security report error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 