import React from 'react';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, Brain, MessageCircle, ArrowRight } from 'lucide-react';
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
  onFeatureClick?: (feature: string) => void;
}

const WelcomeSection: React.FC<WelcomeSectionProps> = ({ 
  isAuthenticated, 
  user, 
  profile,
  onSignIn, 
  onSignUp, 
  onGetStarted,
  onSignOut,
  onFeatureClick
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

  const features = [
    {
      id: 'ai-learning',
      icon: Brain,
      title: 'AI-Powered Learning',
      description: 'Personalized AI assistance that adapts to your child\'s unique learning style and pace',
      color: 'purple'
    },
    {
      id: 'parent-support',
      icon: Users,
      title: 'Parent Support',
      description: 'Resources, guidance, and tools to help you support your child\'s learning journey',
      color: 'green'
    },
    {
      id: 'learning-challenges',
      icon: BookOpen,
      title: 'Learning Challenges Support',
      description: 'Specialized support for ADHD, dyslexia, and other learning differences',
      color: 'blue'
    },
    {
      id: 'interactive-conversations',
      icon: MessageCircle,
      title: 'Interactive Learning',
      description: 'Engaging conversations and activities that make learning fun and effective',
      color: 'orange'
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-600 hover:bg-blue-200',
      green: 'bg-green-100 text-green-600 hover:bg-green-200',
      purple: 'bg-purple-100 text-purple-600 hover:bg-purple-200',
      orange: 'bg-orange-100 text-orange-600 hover:bg-orange-200'
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <div className="space-y-8">
      {/* Header with Auth Buttons */}
      <div className="flex justify-between items-start">
        <div></div> {/* Empty div for spacing */}
        <div className="flex flex-col items-end gap-2">
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
      </div>

      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-2xl sm:text-4xl font-bold text-gray-800">
          Welcome to Joyful Learner
        </h1>
        <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto px-4">
          Empowering every child to learn with joy through personalized AI assistance
          that adapts to their unique needs and learning style.
        </p>
        <Button 
          onClick={onGetStarted}
          size="lg" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-8 py-2 sm:py-3 text-base sm:text-lg"
        >
          Get Started
        </Button>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-8 sm:mt-12">
        {features.map((feature) => {
          const IconComponent = feature.icon;
          return (
            <button
              key={feature.id}
              onClick={() => onFeatureClick?.(feature.id)}
              className="text-center p-4 sm:p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200 hover:border-gray-300 cursor-pointer group"
            >
              <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 transition-colors ${getColorClasses(feature.color)}`}>
                <IconComponent className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-xs sm:text-sm mb-3">
                {feature.description}
              </p>
              <div className="flex items-center justify-center text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs sm:text-sm font-medium">Learn More</span>
                <ArrowRight size={14} className="ml-1" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default WelcomeSection;
