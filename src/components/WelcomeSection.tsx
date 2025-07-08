import React from 'react';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, Brain, MessageCircle, ArrowRight, Star, MessageSquare } from 'lucide-react';
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
      id: 'ai-interactive-learning',
      icon: Brain,
      title: 'AI Interactive Learning',
      description: 'Personalized AI conversations and activities that adapt to your child\'s unique learning style',
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
      id: 'personalized-learning-setup',
      icon: BookOpen,
      title: 'Personalized Learning Setup',
      description: 'Create your child\'s learning profile to unlock personalized educational experiences',
      color: 'blue'
    },
    {
      id: 'chat-history',
      icon: MessageSquare,
      title: 'Chat History',
      description: 'Review and continue previous learning conversations with your child',
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
    <div className="space-y-12">
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

      {/* Hero Section - Now More Prominent */}
      <div className="text-center space-y-6 max-w-4xl mx-auto">
        <h1 className="text-3xl sm:text-5xl font-bold text-gray-800 leading-tight">
          Welcome to Learning Lift
        </h1>
        <div className="space-y-4 text-lg sm:text-xl text-gray-700 leading-relaxed">
          <p>
            Unlock the full potential of AI-powered education with lightning-fast content generation that adapts to any number of students.
          </p>
          <p>
            Our platform serves teachers, parents, and tutors with personalized learning plans, worksheets, activities, and ongoing guidance - all created in seconds based on your input.
          </p>
          <p>
            Every student gets unique, high-quality educational content that adapts to their specific needs, learning style, and pace.
          </p>
          <p>
            Experience education where speed meets personalization, and every learner receives the guidance they need to thrive.
          </p>
        </div>
        <Button 
          onClick={onGetStarted}
          size="lg" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 sm:px-10 py-3 sm:py-4 text-lg sm:text-xl font-semibold"
        >
          Get Started
        </Button>
      </div>

      {/* Features Section - Now Less Prominent */}
      <div className="space-y-6 pt-8 border-t border-gray-200">
        <div className="text-center">
          <h2 className="text-lg sm:text-xl font-medium text-gray-700 mb-2">
            Explore Our Features
          </h2>
          <p className="text-gray-500 text-sm sm:text-base max-w-2xl mx-auto">
            Learn more about how our platform can support your educational needs
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {features.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <button
                key={feature.id}
                onClick={() => onFeatureClick?.(feature.id)}
                className="text-center p-3 sm:p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-gray-300 cursor-pointer group"
              >
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 transition-colors ${getColorClasses(feature.color)}`}>
                  <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <h3 className="text-sm sm:text-base font-medium text-gray-800 mb-1 group-hover:text-blue-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-xs sm:text-sm mb-2">
                  {feature.description}
                </p>
                <div className="flex items-center justify-center text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs font-medium">Learn More</span>
                  <ArrowRight size={12} className="ml-1" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WelcomeSection;
