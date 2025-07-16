// Password validation utility
export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  requirements: {
    length: boolean;
  };
}

export const validatePassword = (password: string): PasswordValidationResult => {
  const errors: string[] = [];
  const requirements = {
    length: password.length >= 6,
  };

  if (!requirements.length) {
    errors.push('Password must be at least 6 characters long');
  }

  return {
    isValid: errors.length === 0,
    errors,
    requirements,
  };
};

export const getPasswordRequirementsText = (): string => {
  return 'Password must be at least 6 characters long.';
};

export const getPasswordRequirementsList = (): string[] => {
  return [
    'At least 6 characters long',
  ];
}; 