import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

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
  const { toast } = useToast();
  const { user, profile } = useAuth();

  const clearForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFirstName('');
    setLastName('');
    setErrors({});
    setHasAttemptedSubmit(false);
    setTopErrorMessage('');
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
                </form>
              </TabsContent>
              
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
