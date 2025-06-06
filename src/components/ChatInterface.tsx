
import React, { useState, useRef, useEffect } from 'react';
import { Send, ArrowLeft, Bot, User } from 'lucide-react';

interface ChatInterfaceProps {
  selectedCategories: {
    subject: string;
    ageGroup: string;
    challenge: string;
  };
  onBack: () => void;
}

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ selectedCategories, onBack }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initial AI greeting
    const initMessage = () => {
      const greeting = generateInitialGreeting();
      setMessages([{
        id: '1',
        type: 'ai',
        content: greeting,
        timestamp: new Date()
      }]);
    };
    
    setTimeout(initMessage, 500);
  }, [selectedCategories]);

  const generateInitialGreeting = () => {
    const categoryInfo = [];
    if (selectedCategories.subject) categoryInfo.push(`subject: ${selectedCategories.subject}`);
    if (selectedCategories.ageGroup) categoryInfo.push(`age group: ${selectedCategories.ageGroup}`);
    if (selectedCategories.challenge) categoryInfo.push(`challenge: ${selectedCategories.challenge}`);

    const categoryText = categoryInfo.length > 0 
      ? ` I see you've selected ${categoryInfo.join(', ')}.` 
      : '';

    return `Hi there! I'm here to help you find fun and engaging ways to support your child's learning.${categoryText}

To get started, could you tell me a bit about your child and what specific challenges or goals you're working on? For example:
- What subjects are they struggling with most?
- What activities do they enjoy?
- Have you tried any learning methods that worked well or didn't work?

Feel free to share as much or as little as you'd like - I'm here to listen and help! 😊`;
  };

  const simulateAIResponse = (userMessage: string) => {
    setIsTyping(true);
    
    setTimeout(() => {
      let response = '';
      
      // Simple response logic based on keywords
      if (userMessage.toLowerCase().includes('math')) {
        response = `I understand math can be challenging! Here are some engaging ways to make math more fun:

🎮 **Math Games Ideas:**
- Use cooking to practice fractions and measurements
- Play "Math Detective" - hide numbers around the house
- Use building blocks for geometry and counting
- Try math apps like Prodigy or Khan Academy Kids

🧩 **Hands-on Activities:**
- Use colorful manipulatives (counting bears, blocks)
- Create math stories with their favorite characters
- Play board games that involve counting and strategy

Would you like me to suggest specific activities based on what math topics they're working on? Also, what does your child enjoy doing in their free time? This will help me tailor the suggestions better! 😊`;
      } else if (userMessage.toLowerCase().includes('reading') || userMessage.toLowerCase().includes('dyslexia')) {
        response = `Reading support is so important! Here are some strategies that can really help:

📚 **Reading Engagement:**
- Start with books about their interests (dinosaurs, sports, etc.)
- Try audiobooks while following along with text
- Use graphic novels and comics
- Create a cozy reading nook with soft lighting

🎯 **Specific Strategies:**
- Break reading into short 10-15 minute sessions
- Use finger tracking or reading rulers
- Try different fonts (some kids read better with dyslexia-friendly fonts)
- Celebrate small wins with a reading chart

What type of books or stories does your child gravitate toward? And are there any specific reading skills they're working on (phonics, comprehension, fluency)?`;
      } else if (userMessage.toLowerCase().includes('focus') || userMessage.toLowerCase().includes('adhd')) {
        response = `Focus challenges are very common! Here are some strategies that work well:

⏰ **Attention Strategies:**
- Use timers for short work bursts (10-15 minutes)
- Create a calm, distraction-free workspace
- Try fidget tools or standing desks
- Use visual schedules and checklists

🎯 **Engagement Techniques:**
- Incorporate movement breaks every 20 minutes
- Use colorful, interactive materials
- Break tasks into smaller, manageable chunks
- Offer choices when possible

What subjects or activities does your child focus on best? And what time of day do they seem most alert and ready to learn?`;
      } else {
        response = `Thank you for sharing that with me! To help me give you the best suggestions, could you tell me more about:

🤔 **A few questions to help me understand better:**
- What specific subjects or skills are you working on?
- What does your child enjoy doing? (sports, art, video games, etc.)
- What time of day works best for learning activities?
- Have you noticed any patterns in what helps them stay engaged?
- Are there any particular challenges that come up repeatedly?

The more I know about your child's interests and learning style, the better I can tailor fun, engaging activities that will help them succeed! 😊`;
      }

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'ai',
        content: response,
        timestamp: new Date()
      }]);
      setIsTyping(false);
    }, 2000);
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    
    // Simulate AI response
    simulateAIResponse(inputValue);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 p-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
              <Bot className="text-white" size={20} />
            </div>
            <div>
              <h1 className="font-semibold text-gray-800">Learning Support Assistant</h1>
              <p className="text-sm text-gray-600">Here to help with your child's learning journey</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.type === 'ai' && (
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="text-white" size={16} />
                </div>
              )}
              <div
                className={`max-w-3xl px-4 py-3 rounded-2xl ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white ml-12'
                    : 'bg-white/80 backdrop-blur-sm text-gray-800 border border-white/20 shadow-sm'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                <div className={`text-xs mt-2 ${message.type === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              {message.type === 'user' && (
                <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="text-white" size={16} />
                </div>
              )}
            </div>
          ))}
          
          {isTyping && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                <Bot className="text-white" size={16} />
              </div>
              <div className="bg-white/80 backdrop-blur-sm px-4 py-3 rounded-2xl border border-white/20 shadow-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white/80 backdrop-blur-sm border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Describe your child's situation, challenges, or what you'd like help with..."
              className="flex-1 border border-gray-300 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl transition-all duration-200 flex items-center justify-center"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
