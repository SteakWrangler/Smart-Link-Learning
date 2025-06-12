import React from 'react';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, Target, MessageCircle } from 'lucide-react';

interface WelcomeSectionProps {
  onGetStarted: () => void;
}

const WelcomeSection: React.FC<WelcomeSectionProps> = ({ onGetStarted }) => {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-800">
          Welcome to Joyful Learner
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Empowering every student to learn with joy through personalized AI assistance
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
            AI adapts to each student's learning style and pace
          </p>
        </div>

        <div className="text-center p-6 bg-white rounded-lg shadow-md">
          <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Parent & Student Accounts
          </h3>
          <p className="text-gray-600 text-sm">
            Separate dashboards for parents and students
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
