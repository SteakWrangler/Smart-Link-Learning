import React from 'react';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, Target, MessageCircle } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { Profile } from '@/types/database';

interface WelcomeSectionProps {
  isAuthenticated: boolean;
  user: User | null;
  profile: Profile | null;
  onSignIn: () => void;
  onSignUp: () => void;
  onGetStarted: () => void;
  onSignOut: () => void;
}

const WelcomeSection: React.FC<WelcomeSectionProps> = ({ 
  isAuthenticated, 
  user, 
  profile,
  onSignIn, 
  onSignUp, 
  onGetStarted,
  onSignOut
}) => {
  // Get user's display name
  const getUserDisplayName = () => {
    if (!profile) return user?.email || 'User';
    
    const firstName = profile.first_name || '';
    const lastName = profile.last_name || '';
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else if (lastName) {
      return lastName;
    } else {
      return user?.email || 'User';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header with Auth Buttons */}
      <div className="flex justify-between items-start">
        <div></div> {/* Empty div for spacing */}
        <div className="flex flex-col items-end gap-2">
          {isAuthenticated ? (
            <>
              <div className="text-sm text-gray-600">
                Signed in as {getUserDisplayName()}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onSignOut}
              >
                Sign Out
              </Button>
            </>
          ) : (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onSignIn}
              >
                Sign In
              </Button>
              <Button 
                size="sm" 
                onClick={onSignUp}
              >
                Sign Up
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-800">
          Welcome to Joyful Learner
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Empowering every child to learn with joy through personalized AI assistance
          that adapts to their unique needs and learning style.
        </p>
        <Button 
          onClick={onGetStarted}
          size="lg" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
        >
          Get Started
        </Button>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
        <div className="text-center p-6 bg-white rounded-lg shadow-md">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Personalized Learning
          </h3>
          <p className="text-gray-600 text-sm">
            AI adapts to each child's learning style and pace
          </p>
        </div>

        <div className="text-center p-6 bg-white rounded-lg shadow-md">
          <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Family Learning Platform
          </h3>
          <p className="text-gray-600 text-sm">
            One account for parents and students to learn together
          </p>
        </div>

        <div className="text-center p-6 bg-white rounded-lg shadow-md">
          <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Learning Challenges
          </h3>
          <p className="text-gray-600 text-sm">
            Support for ADHD, dyslexia, and other learning differences
          </p>
        </div>

        <div className="text-center p-6 bg-white rounded-lg shadow-md">
          <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-orange-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Interactive Conversations
          </h3>
          <p className="text-gray-600 text-sm">
            Engaging AI conversations that make learning fun
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeSection;
