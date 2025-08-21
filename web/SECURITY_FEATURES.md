# Security Features

## Overview

This journal application includes comprehensive security features to protect your private journal entries and ensure your privacy.

## Session Security

### Automatic Logout Features

1. **Inactivity Timeout**: Automatically logs you out after a period of inactivity
   - Default: 15 minutes (configurable)
   - Options: 5, 15, 30, or 60 minutes
   - Warning notification 1 minute before logout

2. **Browser Close Detection**: Automatically logs you out when you close the browser
   - Detects browser/tab closure
   - Forces logout on next visit if browser was closed
   - Prevents unauthorized access if someone else opens your browser

3. **Session Validation**: Regular server-side session validation
   - Validates session integrity every minute
   - Detects suspicious activity
   - Logs security events for monitoring

### Security Settings

Users can access security settings by clicking the "Security" button in the top navigation:

- **Session Timeout Configuration**: Choose how long to stay logged in
- **Immediate Logout**: Force logout at any time
- **Security Information**: View active security features
- **Advanced Settings**: Additional security options

## Privacy Protection

### Data Security

1. **Encrypted Storage**: All journal entries are encrypted at rest
2. **Secure Transmission**: All data transmitted over HTTPS
3. **Session Isolation**: Each session is isolated and tracked
4. **Activity Logging**: Security events are logged for monitoring

### Access Control

1. **Authentication Required**: All journal access requires login
2. **Session Management**: Automatic session cleanup
3. **Device Tracking**: Sessions are tied to specific devices
4. **IP Monitoring**: Suspicious IP changes are detected

## Security Best Practices

### For Users

1. **Choose Appropriate Timeout**: Use shorter timeouts for sensitive content
2. **Log Out Manually**: Use the "Sign Out Now" button when leaving
3. **Close Browser**: Always close browser when done
4. **Monitor Sessions**: Check for unusual activity

### For Administrators

1. **Security Monitoring**: Monitor security events dashboard
2. **Session Tracking**: Track active sessions and suspicious activity
3. **Rate Limiting**: Prevent brute force attacks
4. **Audit Logging**: Maintain comprehensive security logs

## Technical Implementation

### Session Security Components

- `useInactivityTimer`: Manages inactivity detection and timeout
- `SessionSecuritySettings`: User interface for security configuration
- `AuthProvider`: Enhanced authentication with security features
- `sessionSecurity.ts`: Server-side session validation

### Security Events

The system logs various security events:

- Login attempts (successful and failed)
- Logout events
- Session timeouts
- Browser close detection
- Suspicious activity detection

### Configuration

Security settings are stored in localStorage and can be configured per user:

```javascript
// Set inactivity timeout (in milliseconds)
localStorage.setItem('inactivityTimeout', '900000'); // 15 minutes

// Check if browser was closed
const wasClosed = checkBrowserWasClosed();
```

## Security Recommendations

1. **Use Short Timeouts**: 5-15 minutes for maximum security
2. **Enable Notifications**: Allow browser notifications for timeout warnings
3. **Regular Logouts**: Manually log out when leaving the application
4. **Monitor Activity**: Check for unusual login patterns
5. **Strong Passwords**: Use strong, unique passwords for your account

## Privacy Compliance

This application is designed with privacy in mind:

- No tracking of journal content
- Minimal data collection
- User-controlled session management
- Transparent security features
- GDPR-compliant data handling

## Support

If you have security concerns or questions:

1. Check the security settings in the application
2. Review your session activity
3. Contact support for security-related issues
4. Report any suspicious activity immediately
