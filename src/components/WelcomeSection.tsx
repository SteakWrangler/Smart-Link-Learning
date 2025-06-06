
import React from 'react';
import { Heart, Brain, Users, Star } from 'lucide-react';

const WelcomeSection = () => {
  return (
    <div className="text-center max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex justify-center items-center gap-2 mb-4">
          <Heart className="text-red-400" size={32} />
          <Brain className="text-blue-400" size={32} />
          <Star className="text-yellow-400" size={32} />
        </div>
        <h1 className="text-5xl font-bold text-gray-800 mb-4">
          Learning Support Hub
        </h1>
        <p className="text-xl text-gray-600 mb-6 max-w-3xl mx-auto leading-relaxed">
          Every child learns differently. We're here to help you discover fun, engaging ways to support your child's unique learning journey.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="text-blue-600" size={24} />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">AI-Powered Ideas</h3>
          <p className="text-gray-600 text-sm">
            Get personalized learning activities and games tailored to your child's specific needs and interests.
          </p>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="text-green-600" size={24} />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Parent Support</h3>
          <p className="text-gray-600 text-sm">
            Connect with resources and strategies designed specifically for parents navigating learning challenges.
          </p>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star className="text-purple-600" size={24} />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Fun & Engaging</h3>
          <p className="text-gray-600 text-sm">
            Learning through play! Every suggestion focuses on making education enjoyable and stress-free.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeSection;
