
import React, { useState } from 'react';
import { MessageCircle, BookOpen, Users, Brain, Star, Heart, Settings } from 'lucide-react';
import WelcomeSection from '../components/WelcomeSection';
import Dashboard from '../components/Dashboard';

const Index = () => {
  const [showDashboard, setShowDashboard] = useState(false);

  const handleGetStarted = () => {
    setShowDashboard(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {!showDashboard ? (
        <div className="container mx-auto px-4 py-8">
          <WelcomeSection />
          
          <div className="max-w-4xl mx-auto mt-12">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Ready to transform your child's learning experience?
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Create personalized lesson plans, track progress, and access expert guidance - all tailored to your child's unique learning needs.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="text-blue-600" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Multiple Children</h3>
                <p className="text-gray-600 text-sm">
                  Create profiles for each child with their unique learning needs and challenges
                </p>
              </div>

              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <BookOpen className="text-green-600" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Custom Lesson Plans</h3>
                <p className="text-gray-600 text-sm">
                  Get detailed, step-by-step activities designed specifically for your child
                </p>
              </div>

              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <Star className="text-purple-600" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Track & Save</h3>
                <p className="text-gray-600 text-sm">
                  Save successful activities and track your child's learning journey
                </p>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-3 mx-auto"
              >
                <Settings size={24} />
                Get Started with Your Dashboard
              </button>
              <p className="text-sm text-gray-500 mt-3">
                Set up your children's profiles and start creating personalized lesson plans
              </p>
            </div>
          </div>
        </div>
      ) : (
        <Dashboard onBack={() => setShowDashboard(false)} />
      )}
    </div>
  );
};

export default Index;
