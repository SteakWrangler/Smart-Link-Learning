
import { toast } from 'sonner';

export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

export class DatabaseError extends Error {
  code: string;
  details?: any;

  constructor(message: string, code: string = 'DATABASE_ERROR', details?: any) {
    super(message);
    this.name = 'DatabaseError';
    this.code = code;
    this.details = details;
  }
}

export class AuthenticationError extends Error {
  code: string;

  constructor(message: string = 'Authentication required', code: string = 'AUTH_ERROR') {
    super(message);
    this.name = 'AuthenticationError';
    this.code = code;
  }
}

export class ValidationError extends Error {
  code: string;
  field?: string;

  constructor(message: string, field?: string, code: string = 'VALIDATION_ERROR') {
    super(message);
    this.name = 'ValidationError';
    this.code = code;
    this.field = field;
  }
}

export const handleError = (error: unknown, context?: string): AppError => {
  console.error(`Error in ${context || 'unknown context'}:`, error);
  
  const timestamp = new Date();
  
  if (error instanceof DatabaseError) {
    toast.error(`Database Error: ${error.message}`);
    return {
      code: error.code,
      message: error.message,
      details: error.details,
      timestamp
    };
  }
  
  if (error instanceof AuthenticationError) {
    toast.error(`Authentication Error: ${error.message}`);
    return {
      code: error.code,
      message: error.message,
      timestamp
    };
  }
  
  if (error instanceof ValidationError) {
    toast.error(`Validation Error: ${error.message}`);
    return {
      code: error.code,
      message: error.message,
      details: { field: error.field },
      timestamp
    };
  }
  
  // Handle Supabase errors
  if (error && typeof error === 'object' && 'message' in error) {
    const supabaseError = error as any;
    if (supabaseError.code) {
      toast.error(`Database Error: ${supabaseError.message}`);
      return {
        code: supabaseError.code,
        message: supabaseError.message,
        details: supabaseError,
        timestamp
      };
    }
  }
  
  // Generic error handling
  const message = error instanceof Error ? error.message : 'An unexpected error occurred';
  toast.error(message);
  
  return {
    code: 'UNKNOWN_ERROR',
    message,
    details: error,
    timestamp
  };
};

export const withErrorHandling = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: string
) => {
  return async (...args: T): Promise<R | null> => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, context);
      return null;
    }
  };
};
