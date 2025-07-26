import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, AlertCircle, Check, X, Mail, Lock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { validatePassword, getPasswordRequirementsList } from '@/utils/passwordValidation';

interface AuthProps {
  onAuthSuccess: () => void;
  onBack?: () => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess, onBack }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [topErrorMessage, setTopErrorMessage] = useState<string>('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);
  const { toast } = useToast();
  const { user, profile } = useAuth();

  // Check for password reset parameters on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const resetParam = urlParams.get('reset');
    const accessToken = urlParams.get('access_token');
    const refreshToken = urlParams.get('refresh_token');
    
    if (resetParam === 'true' && accessToken && refreshToken) {
      // Set the session with the tokens from the password reset link
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      }).then(({ data, error }) => {
        if (!error && data.session) {
          setShowPasswordReset(true);
          // Clear the URL parameters
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      });
    }
  }, []);

  const clearForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFirstName('');
    setLastName('');
    setErrors({});
    setHasAttemptedSubmit(false);
    setTopErrorMessage('');
    setShowForgotPassword(false);
    setForgotPasswordEmail('');
    setForgotPasswordSent(false);
    setShowPasswordReset(false);
    setNewPassword('');
    setConfirmNewPassword('');
  };

  const validateSignInForm = () => {
    setHasAttemptedSubmit(true);
    const newErrors: {[key: string]: string} = {};
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    }
    
    if (!password.trim()) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      setTopErrorMessage('Please fill in all required fields marked with *');
    } else {
      setTopErrorMessage('');
    }
    
    return Object.keys(newErrors).length === 0;
  };

  const validateSignUpForm = () => {
    setHasAttemptedSubmit(true);
    const newErrors: {[key: string]: string} = {};
    
    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    }
    
    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else {
      // Validate password requirements
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.errors.join(', ');
      }
    }
    
    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      if (newErrors.confirmPassword === 'Passwords do not match') {
        setTopErrorMessage('Passwords do not match');
      } else if (newErrors.password && newErrors.password.includes('Password must')) {
        setTopErrorMessage('Password does not meet requirements');
      } else {
        setTopErrorMessage('Please fill in all required fields marked with *');
      }
    } else {
      setTopErrorMessage('');
    }
    
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateSignUpForm()) {
      return;
    }
    
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;

      toast({
        title: "Account Created!",
        description: "Please check your email and click the confirmation link. After confirming, return here and sign in with your credentials.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateSignInForm()) {
      return;
    }
    
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });
      
      onAuthSuccess();
    } catch (error: any) {
      // Clear any form validation errors since this is an auth error
      setErrors({});
      setHasAttemptedSubmit(false);
      
      let errorMessage = "Incorrect email or password";
      
      if (error.message.includes('Email not confirmed')) {
        errorMessage = "Please check your email and confirm your account before signing in.";
      }
      
      setTopErrorMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!forgotPasswordEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setForgotPasswordLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail.trim(), {
        redirectTo: `${window.location.origin}/?reset=true`,
      });

      if (error) throw error;

      setForgotPasswordSent(true);
      toast({
        title: "Password Reset Email Sent",
        description: "Check your email for a password reset link. If you don't see it, check your spam folder.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send password reset email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword.trim()) {
      toast({
        title: "Error",
        description: "Please enter a new password.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    // Validate password requirements
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      toast({
        title: "Password Requirements Not Met",
        description: passwordValidation.errors.join(', '),
        variant: "destructive",
      });
      return;
    }

    setPasswordResetLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Password Reset Successfully",
        description: "Your password has been updated. You can now sign in with your new password.",
      });
      
      setShowPasswordReset(false);
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPasswordResetLoading(false);
    }
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
      <div className="w-full max-w-md">
        {/* Header with Back Button */}
        <div className="mb-4">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
            >
              <ArrowLeft size={16} />
              Back to Features
            </button>
          )}
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Welcome to Smart Link Learning</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full" onValueChange={clearForm}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="space-y-4">
                {topErrorMessage && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center text-red-700">
                      <AlertCircle className="mr-2" size={16} />
                      <span className="text-sm font-medium">{topErrorMessage}</span>
                    </div>
                  </div>
                )}
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="flex items-center">
                      Email <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      id="signin-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={errors.email && hasAttemptedSubmit ? "border-red-500" : ""}
                    />
                    {errors.email && hasAttemptedSubmit && (
                      <p className="text-sm text-red-500 mt-1 flex items-center">
                        <AlertCircle className="mr-1" size={16} />
                        {errors.email}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="flex items-center">
                      Password <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      id="signin-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className={errors.password && hasAttemptedSubmit ? "border-red-500" : ""}
                    />
                    {errors.password && hasAttemptedSubmit && (
                      <p className="text-sm text-red-500 mt-1 flex items-center">
                        <AlertCircle className="mr-1" size={16} />
                        {errors.password}
                      </p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </Button>
                  <p className="text-sm text-gray-600 text-center">
                    Just created an account? Check your email for a confirmation link, then sign in here.
                  </p>
                  <div className="text-center">
                    <button
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                </form>
              </TabsContent>
              
              {/* Forgot Password Modal */}
              {showForgotPassword && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                    {!forgotPasswordSent ? (
                      <>
                        <div className="flex items-center gap-3 mb-4">
                          <Mail className="text-blue-600" size={24} />
                          <h3 className="text-lg font-semibold text-gray-800">Reset Password</h3>
                        </div>
                        
                        <p className="text-gray-600 mb-6">
                          Enter your email address and we'll send you a link to reset your password.
                        </p>
                        
                        <form onSubmit={handleForgotPassword} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="forgot-password-email" className="flex items-center">
                              Email Address <span className="text-red-500 ml-1">*</span>
                            </Label>
                            <Input
                              id="forgot-password-email"
                              type="email"
                              value={forgotPasswordEmail}
                              onChange={(e) => setForgotPasswordEmail(e.target.value)}
                              placeholder="Enter your email address"
                              required
                            />
                          </div>
                          
                          <div className="flex gap-3">
                            <Button
                              type="button"
                              onClick={() => setShowForgotPassword(false)}
                              variant="outline"
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              disabled={forgotPasswordLoading}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              {forgotPasswordLoading ? 'Sending...' : 'Send Reset Link'}
                            </Button>
                          </div>
                        </form>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-3 mb-4">
                          <Check className="text-green-600" size={24} />
                          <h3 className="text-lg font-semibold text-gray-800">Email Sent!</h3>
                        </div>
                        
                        <p className="text-gray-600 mb-6">
                          We've sent a password reset link to <strong>{forgotPasswordEmail}</strong>. 
                          Please check your email and click the link to reset your password.
                        </p>
                        
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                          <p className="text-sm text-blue-700">
                            <strong>Didn't receive the email?</strong> Check your spam folder or try again with a different email address.
                          </p>
                        </div>
                        
                        <div className="flex gap-3">
                          <Button
                            onClick={() => {
                              setShowForgotPassword(false);
                              setForgotPasswordSent(false);
                              setForgotPasswordEmail('');
                            }}
                            variant="outline"
                            className="flex-1"
                          >
                            Close
                          </Button>
                          <Button
                            onClick={() => {
                              setForgotPasswordSent(false);
                              setForgotPasswordEmail('');
                            }}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            Try Again
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
              
              {/* Password Reset Modal */}
              {showPasswordReset && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Lock className="text-green-600" size={24} />
                      <h3 className="text-lg font-semibold text-gray-800">Set New Password</h3>
                    </div>
                    
                    <p className="text-gray-600 mb-6">
                      Please enter your new password below.
                    </p>
                    
                    <form onSubmit={handlePasswordReset} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-password" className="flex items-center">
                          New Password <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Input
                          id="new-password"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter your new password"
                          required
                        />
                        
                        {/* Password Requirements */}
                        {newPassword && (
                          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</p>
                            <div className="space-y-1">
                              {(() => {
                                const validation = validatePassword(newPassword);
                                return getPasswordRequirementsList().map((requirement, index) => {
                                  const isMet = Object.values(validation.requirements)[index];
                                  return (
                                    <div key={index} className="flex items-center text-xs">
                                      {isMet ? (
                                        <Check className="mr-2 text-green-500" size={14} />
                                      ) : (
                                        <X className="mr-2 text-red-500" size={14} />
                                      )}
                                      <span className={isMet ? "text-green-700" : "text-red-700"}>
                                        {requirement}
                                      </span>
                                    </div>
                                  );
                                });
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="confirm-new-password" className="flex items-center">
                          Confirm New Password <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Input
                          id="confirm-new-password"
                          type="password"
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          placeholder="Confirm your new password"
                          required
                        />
                      </div>
                      
                      <div className="flex gap-3">
                        <Button
                          type="button"
                          onClick={() => setShowPasswordReset(false)}
                          variant="outline"
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={passwordResetLoading}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        >
                          {passwordResetLoading ? 'Updating...' : 'Update Password'}
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
              
              <TabsContent value="signup" className="space-y-4">
                {topErrorMessage && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center text-red-700">
                      <AlertCircle className="mr-2" size={16} />
                      <span className="text-sm font-medium">{topErrorMessage}</span>
                    </div>
                  </div>
                )}
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first-name" className="flex items-center">
                        First Name <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input
                        id="first-name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        className={errors.firstName && hasAttemptedSubmit ? "border-red-500" : ""}
                      />
                      {errors.firstName && hasAttemptedSubmit && (
                        <p className="text-sm text-red-500 mt-1 flex items-center">
                          <AlertCircle className="mr-1" size={16} />
                          {errors.firstName}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last-name" className="flex items-center">
                        Last Name <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input
                        id="last-name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        className={errors.lastName && hasAttemptedSubmit ? "border-red-500" : ""}
                      />
                      {errors.lastName && hasAttemptedSubmit && (
                        <p className="text-sm text-red-500 mt-1 flex items-center">
                          <AlertCircle className="mr-1" size={16} />
                          {errors.lastName}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="flex items-center">
                      Email <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={errors.email && hasAttemptedSubmit ? "border-red-500" : ""}
                    />
                    {errors.email && hasAttemptedSubmit && (
                      <p className="text-sm text-red-500 mt-1 flex items-center">
                        <AlertCircle className="mr-1" size={16} />
                        {errors.email}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="flex items-center">
                      Password <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className={errors.password && hasAttemptedSubmit ? "border-red-500" : ""}
                    />
                    {errors.password && hasAttemptedSubmit && (
                      <p className="text-sm text-red-500 mt-1 flex items-center">
                        <AlertCircle className="mr-1" size={16} />
                        {errors.password}
                      </p>
                    )}
                    
                    {/* Password Requirements */}
                    {password && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</p>
                        <div className="space-y-1">
                          {(() => {
                            const validation = validatePassword(password);
                            return getPasswordRequirementsList().map((requirement, index) => {
                              const isMet = Object.values(validation.requirements)[index];
                              return (
                                <div key={index} className="flex items-center text-xs">
                                  {isMet ? (
                                    <Check className="mr-2 text-green-500" size={14} />
                                  ) : (
                                    <X className="mr-2 text-red-500" size={14} />
                                  )}
                                  <span className={isMet ? "text-green-700" : "text-red-700"}>
                                    {requirement}
                                  </span>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="flex items-center">
                      Confirm Password <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className={errors.confirmPassword && hasAttemptedSubmit ? "border-red-500" : ""}
                    />
                    {errors.confirmPassword && hasAttemptedSubmit && (
                      <p className="text-sm text-red-500 mt-1 flex items-center">
                        <AlertCircle className="mr-1" size={16} />
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
