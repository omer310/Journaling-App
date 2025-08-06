'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { RiShieldLine, RiAlertLine, RiUserLine, RiTimeLine, RiMapPinLine, RiLockLine } from 'react-icons/ri';

interface SecurityEvent {
  id: string;
  user_id: string;
  email: string;
  event_type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: string;
  details: any;
}

interface UserSession {
  id: string;
  user_id: string;
  session_id: string;
  ip_address: string;
  user_agent: string;
  active: boolean;
  created_at: string;
  last_activity: string;
}

export default function SecurityDashboard() {
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [userSessions, setUserSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [stats, setStats] = useState({
    totalEvents: 0,
    criticalEvents: 0,
    activeSessions: 0,
    suspiciousActivity: 0
  });

  // Admin password from environment variable
  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

  useEffect(() => {
    // Check if already authenticated
    const isAuth = sessionStorage.getItem('admin_authenticated');
    if (isAuth === 'true') {
      setAuthenticated(true);
      fetchSecurityData();
    }
  }, []);

  useEffect(() => {
    if (authenticated) {
      fetchSecurityData();
      const interval = setInterval(fetchSecurityData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [authenticated]);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (adminPassword === ADMIN_PASSWORD) {
      setAuthenticated(true);
      sessionStorage.setItem('admin_authenticated', 'true');
    } else {
      setPasswordError('Incorrect admin password');
    }
  };

  const handleLogout = () => {
    setAuthenticated(false);
    sessionStorage.removeItem('admin_authenticated');
    setSecurityEvents([]);
    setUserSessions([]);
  };

  const fetchSecurityData = async () => {
    try {
      // Fetch security events
      const { data: events, error: eventsError } = await supabase
        .from('security_events')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50);

      if (eventsError) {
        console.error('Error fetching security events:', eventsError);
      } else {
        setSecurityEvents(events || []);
      }

      // Fetch user sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('active', true)
        .order('last_activity', { ascending: false });

      if (sessionsError) {
        console.error('Error fetching user sessions:', sessionsError);
      } else {
        setUserSessions(sessions || []);
      }

      // Calculate stats
      const criticalCount = (events || []).filter(e => e.severity === 'CRITICAL').length;
      const suspiciousCount = (events || []).filter(e => 
        e.event_type === 'FAILED_LOGIN' || e.event_type === 'SUSPICIOUS_ACTIVITY'
      ).length;

      setStats({
        totalEvents: events?.length || 0,
        criticalEvents: criticalCount,
        activeSessions: sessions?.length || 0,
        suspiciousActivity: suspiciousCount
      });

    } catch (error) {
      console.error('Error fetching security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'text-red-600 bg-red-100';
      case 'HIGH': return 'text-orange-600 bg-orange-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'LOW': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  // Admin login form
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="bg-surface p-8 rounded-lg border border-border">
            <div className="text-center mb-6">
              <RiLockLine className="text-4xl text-primary mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-text-primary">Admin Access</h1>
              <p className="text-text-secondary mt-2">Enter admin password to access security dashboard</p>
            </div>
            
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-2">
                  Admin Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter admin password"
                  required
                />
              </div>
              
              {passwordError && (
                <p className="text-red-500 text-sm">{passwordError}</p>
              )}
              
              <button
                type="submit"
                className="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors duration-200"
              >
                Access Dashboard
              </button>
            </form>
            
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Environment Variable Set:</strong> NEXT_PUBLIC_ADMIN_PASSWORD
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Using secure environment variable for authentication.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-secondary">Loading security dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-text-primary">Security Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
          >
            Logout Admin
          </button>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-surface p-6 rounded-lg border border-border">
            <div className="flex items-center">
              <RiShieldLine className="text-2xl text-blue-500 mr-3" />
              <div>
                <p className="text-sm text-text-secondary">Total Events</p>
                <p className="text-2xl font-bold text-text-primary">{stats.totalEvents}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-surface p-6 rounded-lg border border-border">
            <div className="flex items-center">
              <RiAlertLine className="text-2xl text-red-500 mr-3" />
              <div>
                <p className="text-sm text-text-secondary">Critical Events</p>
                <p className="text-2xl font-bold text-red-500">{stats.criticalEvents}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-surface p-6 rounded-lg border border-border">
            <div className="flex items-center">
              <RiUserLine className="text-2xl text-green-500 mr-3" />
              <div>
                <p className="text-sm text-text-secondary">Active Sessions</p>
                <p className="text-2xl font-bold text-green-500">{stats.activeSessions}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-surface p-6 rounded-lg border border-border">
            <div className="flex items-center">
              <RiAlertLine className="text-2xl text-orange-500 mr-3" />
              <div>
                <p className="text-sm text-text-secondary">Suspicious Activity</p>
                <p className="text-2xl font-bold text-orange-500">{stats.suspiciousActivity}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Security Events */}
          <div className="bg-surface p-6 rounded-lg border border-border">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Recent Security Events</h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {securityEvents.map((event) => (
                <div key={event.id} className="border-l-4 border-border pl-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-text-primary">{event.event_type}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(event.severity)}`}>
                      {event.severity}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary mb-1">{event.email}</p>
                  <p className="text-xs text-text-muted">{formatTimestamp(event.timestamp)}</p>
                  {event.details && (
                    <div className="mt-2 text-xs text-text-muted">
                      <p>IP: {event.details.ip_address || 'Unknown'}</p>
                      {event.details.reason && <p>Reason: {event.details.reason}</p>}
                    </div>
                  )}
                </div>
              ))}
              {securityEvents.length === 0 && (
                <p className="text-text-muted text-center py-4">No security events found</p>
              )}
            </div>
          </div>

          {/* Active Sessions */}
          <div className="bg-surface p-6 rounded-lg border border-border">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Active Sessions</h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {userSessions.map((session) => (
                <div key={session.id} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-text-primary">Session {session.session_id.slice(-8)}</span>
                    <span className="text-xs text-green-500 bg-green-100 px-2 py-1 rounded-full">Active</span>
                  </div>
                  <div className="space-y-1 text-sm text-text-secondary">
                    <div className="flex items-center">
                      <RiMapPinLine className="mr-2" />
                      <span>{session.ip_address || 'Unknown IP'}</span>
                    </div>
                    <div className="flex items-center">
                      <RiTimeLine className="mr-2" />
                      <span>Last activity: {formatTimestamp(session.last_activity)}</span>
                    </div>
                    <div className="text-xs text-text-muted truncate">
                      {session.user_agent || 'Unknown browser'}
                    </div>
                  </div>
                </div>
              ))}
              {userSessions.length === 0 && (
                <p className="text-text-muted text-center py-4">No active sessions found</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 