
import { useState, useCallback } from 'react';
import { handleError, AppError } from '@/utils/errorHandler';

export const useErrorHandler = () => {
  const [errors, setErrors] = useState<AppError[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const executeWithErrorHandling = useCallback(
    async <T,>(
      operation: () => Promise<T>,
      context?: string
    ): Promise<T | null> => {
      setIsLoading(true);
      try {
        const result = await operation();
        return result;
      } catch (error) {
        const appError = handleError(error, context);
        setErrors(prev => [...prev, appError]);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    errors,
    isLoading,
    clearErrors,
    executeWithErrorHandling
  };
};
