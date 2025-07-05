
import DOMPurify from 'dompurify';

// Sanitize HTML content to prevent XSS attacks
export const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'a', 'blockquote'],
    ALLOWED_ATTR: ['href', 'target'],
    ALLOW_DATA_ATTR: false,
  });
};

// Sanitize plain text input
export const sanitizeText = (text: string): string => {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .substring(0, 10000); // Limit length to prevent DoS
};

// Validate and sanitize file descriptions
export const sanitizeFileDescription = (description: string): string => {
  if (!description || typeof description !== 'string') return '';
  
  return description
    .trim()
    .replace(/[<>]/g, '')
    .substring(0, 500); // Reasonable limit for descriptions
};

// Validate file types against allowed list
export const validateFileType = (fileName: string, allowedTypes: string[]): boolean => {
  if (!fileName || typeof fileName !== 'string') return false;
  
  const extension = fileName.toLowerCase().split('.').pop();
  return extension ? allowedTypes.includes(extension) : false;
};

// Validate file size (in bytes)
export const validateFileSize = (size: number, maxSize: number = 50 * 1024 * 1024): boolean => {
  return typeof size === 'number' && size > 0 && size <= maxSize; // 50MB default limit
};

// Sanitize user names and usernames
export const sanitizeUserInput = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '')
    .replace(/[^\w\s-_.]/g, '') // Allow only word characters, spaces, hyphens, underscores, dots
    .substring(0, 100);
};

// Create user-friendly error messages that don't expose system details
export const createSafeErrorMessage = (error: unknown): string => {
  // Don't expose detailed error information to users
  if (error instanceof Error) {
    // Log the actual error for debugging (in a real app, send to logging service)
    console.error('Application error:', error);
    
    // Return generic messages based on error patterns
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return 'Network error. Please check your connection and try again.';
    }
    if (error.message.includes('auth') || error.message.includes('unauthorized')) {
      return 'Authentication required. Please sign in and try again.';
    }
    if (error.message.includes('permission') || error.message.includes('forbidden')) {
      return 'You do not have permission to perform this action.';
    }
    if (error.message.includes('not found') || error.message.includes('404')) {
      return 'The requested resource was not found.';
    }
  }
  
  return 'An unexpected error occurred. Please try again later.';
};

// Validate email format
export const validateEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

// Rate limiting helper (simple in-memory implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (
  identifier: string, 
  maxRequests: number = 10, 
  windowMs: number = 60000
): boolean => {
  const now = Date.now();
  const current = rateLimitMap.get(identifier);
  
  if (!current || now > current.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (current.count >= maxRequests) {
    return false;
  }
  
  current.count++;
  rateLimitMap.set(identifier, current);
  return true;
};
