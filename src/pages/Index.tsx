
import React, { useState } from 'react';
import { MessageCircle, BookOpen, Users, Brain, Star, Heart } from 'lucide-react';
import ChatInterface from '../components/ChatInterface';
import CategorySelector from '../components/CategorySelector';
import WelcomeSection from '../components/WelcomeSection';

const Index = () => {
  const [showChat, setShowChat] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState({
    subject: '',
    ageGroup: '',
    challenge: ''
  });

  const handleStartChat = () => {
    setShowChat(true);
  };

  const handleCategoryChange = (type: string, value: string) => {
    setSelectedCategories(prev => ({
      ...prev,
      [type]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {!showChat ? (
        <div className="container mx-auto px-4 py-8">
          <WelcomeSection />
          
          <div className="max-w-4xl mx-auto mt-12">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Tell us about your child's learning journey
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Select categories that best describe your situation, or skip ahead to start chatting with our AI assistant.
              </p>
            </div>

            <CategorySelector 
              selectedCategories={selectedCategories}
              onCategoryChange={handleCategoryChange}
            />

            <div className="text-center mt-8">
              <button
                onClick={handleStartChat}
                className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-3 mx-auto"
              >
                <MessageCircle size={24} />
                Start Conversation with AI Helper
              </button>
              <p className="text-sm text-gray-500 mt-3">
                Our AI will ask questions to better understand your child's needs
              </p>
            </div>
          </div>
        </div>
      ) : (
        <ChatInterface 
          selectedCategories={selectedCategories}
          onBack={() => setShowChat(false)}
        />
      )}
    </div>
  );
};

export default Index;
