// Simple security event logging utility
interface SecurityEvent {
  type: 'file_upload' | 'rate_limit' | 'validation_error' | 'auth_error';
  userId?: string;
  details: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high';
}

// In-memory store for security events (in production, this should go to a proper logging service)
const securityEvents: SecurityEvent[] = [];

export const logSecurityEvent = (event: Omit<SecurityEvent, 'timestamp'>) => {
  const securityEvent: SecurityEvent = {
    ...event,
    timestamp: new Date()
  };
  
  securityEvents.push(securityEvent);
  
  // Log to console for debugging (in production, send to logging service)
  console.warn('Security Event:', securityEvent);
  
  // Keep only last 1000 events to prevent memory issues
  if (securityEvents.length > 1000) {
    securityEvents.splice(0, 100);
  }
};

export const getRecentSecurityEvents = (userId?: string): SecurityEvent[] => {
  const events = userId 
    ? securityEvents.filter(event => event.userId === userId)
    : securityEvents;
    
  return events.slice(-50); // Return last 50 events
};

// Check for suspicious activity patterns
export const detectSuspiciousActivity = (userId: string): boolean => {
  const userEvents = securityEvents.filter(
    event => event.userId === userId && 
    event.timestamp > new Date(Date.now() - 60000) // Last minute
  );
  
  // Flag if too many security events in short time
  return userEvents.length > 10;
};
