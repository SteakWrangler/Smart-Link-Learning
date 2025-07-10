import React from 'react';
import { Button } from '@/components/ui/button';
import { User } from '@supabase/supabase-js';
import { Profile } from '@/types/database';

interface UserDisplayProps {
  isAuthenticated: boolean;
  user: User | null;
  profile: Profile | null;
  onSignIn: () => void;
  onSignUp: () => void;
  onSignOut: () => void;
  className?: string;
}

const UserDisplay: React.FC<UserDisplayProps> = ({ 
  isAuthenticated, 
  user, 
  profile,
  onSignIn, 
  onSignUp, 
  onSignOut,
  className = ''
}) => {
  // Get user's display name
  const getUserDisplayName = () => {
    if (!profile) return user?.email || 'User';
    
    const firstName = profile.first_name || '';
    const lastName = profile.last_name || '';
    
    const displayName = firstName && lastName 
      ? `${firstName} ${lastName}`
      : firstName 
        ? firstName 
        : lastName 
          ? lastName 
          : user?.email || 'User';
    
    return displayName;
  };

  return (
    <div className={`flex flex-col items-end gap-2 ${className}`}>
      {isAuthenticated ? (
        <>
          <div className="text-xs sm:text-sm text-gray-600 text-right">
            Signed in as {getUserDisplayName()}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onSignOut}
            className="text-xs sm:text-sm"
          >
            Sign Out
          </Button>
        </>
      ) : (
        <div className="flex gap-1 sm:gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onSignIn}
            className="text-xs sm:text-sm"
          >
            Sign In
          </Button>
          <Button 
            size="sm" 
            onClick={onSignUp}
            className="text-xs sm:text-sm"
          >
            Sign Up
          </Button>
        </div>
      )}
    </div>
  );
};

export default UserDisplay; 