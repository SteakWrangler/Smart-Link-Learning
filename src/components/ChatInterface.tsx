
import React, { useState, useRef, useEffect } from 'react';
import { Send, ArrowLeft, Bot, User, Clock, Users, BookOpen, Star, Heart } from 'lucide-react';
import { Child, SavedConversation, Message } from '../types';

interface ChatInterfaceProps {
  selectedCategories: {
    subject: string;
    ageGroup: string;
    challenge: string;
  };
  onBack: () => void;
  selectedChild?: Child;
  onSaveConversation?: (conversation: Omit<SavedConversation, 'id' | 'createdAt'>) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  selectedCategories, 
  onBack, 
  selectedChild,
  onSaveConversation 
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationTitle, setConversationTitle] = useState('');
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
  }, [selectedCategories, selectedChild]);

  const generateInitialGreeting = () => {
    if (selectedChild) {
      const categoryInfo = [];
      if (selectedChild.subjects.length > 0) categoryInfo.push(`subjects: ${selectedChild.subjects.join(', ')}`);
      if (selectedChild.ageGroup) categoryInfo.push(`age group: ${selectedChild.ageGroup}`);
      if (selectedChild.challenges.length > 0) categoryInfo.push(`challenges: ${selectedChild.challenges.join(', ')}`);

      const categoryText = categoryInfo.length > 0 
        ? ` I can see ${selectedChild.name}'s profile shows ${categoryInfo.join(', ')}.` 
        : '';

      return `Hi! I'm excited to help create a perfect lesson plan for ${selectedChild.name}!${categoryText}

To design the most effective activity, could you tell me:
- What specific skill or concept does ${selectedChild.name} need to work on today?
- How much time do you have available?
- What space will you be using for the activity?
- What does ${selectedChild.name} love? And how are they feeling right now?
- What's ${selectedChild.name}'s energy level like right now?

I'll create a complete, step-by-step lesson plan with exact materials, timing, and instructions! 🌟`;
    }

    // Fallback for non-child specific usage
    const categoryInfo = [];
    if (selectedCategories.subject) categoryInfo.push(`subject: ${selectedCategories.subject}`);
    if (selectedCategories.ageGroup) categoryInfo.push(`age group: ${selectedCategories.ageGroup}`);
    if (selectedCategories.challenge) categoryInfo.push(`challenge: ${selectedCategories.challenge}`);

    const categoryText = categoryInfo.length > 0 
      ? ` I see you've selected ${categoryInfo.join(', ')}.` 
      : '';

    return `Hi there! I'm here to help you create complete, ready-to-use lesson plans for your child.${categoryText}

To get started, could you tell me:
- What specific skill needs work? (like "division" or "reading comprehension")
- How much time do you have? (15 min, 30 min, 45 min?)
- Where will you do this? (kitchen table, living room, outside?)
- What does your child love? And how are they feeling right now? (dinosaurs, superheroes, excited, frustrated, calm?)
- What's their energy level like? (high-energy or calm and focused?)

I'll create a detailed lesson plan with exact materials, minute-by-minute timing, and step-by-step instructions! 😊`;
  };

  const simulateAIResponse = (userMessage: string) => {
    setIsTyping(true);
    
    // Generate conversation title if not set
    if (!conversationTitle && userMessage.length > 10) {
      const words = userMessage.split(' ').slice(0, 5).join(' ');
      setConversationTitle(words.length > 30 ? words.substring(0, 30) + '...' : words);
    }
    
    setTimeout(() => {
      let response = '';
      
      // Check if user provided planning details for lesson plan creation
      const hasSubjectInfo = userMessage.toLowerCase().includes('division') || 
                            userMessage.toLowerCase().includes('math') ||
                            userMessage.toLowerCase().includes('reading') ||
                            userMessage.toLowerCase().includes('writing');
      
      const hasTimeInfo = userMessage.toLowerCase().includes('hour') ||
                         userMessage.toLowerCase().includes('minute') ||
                         userMessage.toLowerCase().includes('min');
      
      const hasSpaceInfo = userMessage.toLowerCase().includes('table') ||
                          userMessage.toLowerCase().includes('kitchen') ||
                          userMessage.toLowerCase().includes('room') ||
                          userMessage.toLowerCase().includes('outside') ||
                          userMessage.toLowerCase().includes('backyard');
      
      const hasInterestInfo = userMessage.toLowerCase().includes('dinosaur') ||
                             userMessage.toLowerCase().includes('superhero') ||
                             userMessage.toLowerCase().includes('action figure') ||
                             userMessage.toLowerCase().includes('love') ||
                             userMessage.toLowerCase().includes('favorite');
      
      const hasEnergyInfo = userMessage.toLowerCase().includes('high energy') ||
                           userMessage.toLowerCase().includes('calm') ||
                           userMessage.toLowerCase().includes('focus') ||
                           userMessage.toLowerCase().includes('stay on task') ||
                           userMessage.toLowerCase().includes('frustrated');

      const hasFrustrationInfo = userMessage.toLowerCase().includes('frustrated') ||
                                userMessage.toLowerCase().includes('frustration') ||
                                userMessage.toLowerCase().includes('getting upset');

      // If user provided comprehensive planning info, generate a lesson plan
      if (hasSubjectInfo && (hasTimeInfo || hasEnergyInfo || hasInterestInfo || hasFrustrationInfo)) {
        
        // Division lesson plan with dinosaur theme for high-energy child
        if (userMessage.toLowerCase().includes('division')) {
          response = `Perfect! Here's your **"Dinosaur Division Adventure"** - designed specifically for ${selectedChild?.name || 'your child'} who loves dinosaurs and action figures:

## 🦕 **"Dinosaur Division Rescue Mission" - 25 Minute Lesson**
*(Shorter segments to prevent frustration buildup)*

### **Materials Ready in 2 Minutes:**
- 20-30 small dinosaur toys or action figures
- 4 paper plates or shallow boxes
- Masking tape
- Timer
- Sticker sheet
- Large piece of paper for "mission map"

### **Complete Lesson Plan:**

**⏰ Mission Briefing (3 minutes)**
1. **"Emergency at Dino Park!"** 
   - "The dinosaurs are trapped in groups and need rescue teams!"
   - Show pile of 20 dinosaurs: "We have 20 dinosaurs total"
   - "Each rescue helicopter can only carry 4 dinosaurs. How many trips?"

**⏰ Physical Division Setup (5 minutes)**
2. **Tape 4 "helicopter landing pads"** on floor (paper plates)
3. **Give ${selectedChild?.name || 'your child'} the pile of 20 dinosaurs**
4. **Say: "Put exactly 4 dinosaurs on each landing pad"**
5. **Count together:** "1 pad, 2 pads, 3 pads, 4 pads, 5 pads!"
6. **Big discovery:** "20 ÷ 4 = 5 helicopter trips!"

**⏰ Action Figure Division (8 minutes)**
7. **New mission:** "12 superheroes need to form teams of 3"
8. **Physical sorting:** Let ${selectedChild?.name || 'them'} group 12 action figures into teams of 3
9. **Count teams together:** "1 team, 2 teams, 3 teams, 4 teams!"
10. **Write it down:** "12 ÷ 3 = 4 teams"
11. **Movement break:** Act out each superhero team's special move!

**⏰ Quick Success Round (4 minutes)**
12. **Easier division for confidence:** "8 dinosaurs, 2 per rescue boat"
13. **Let ${selectedChild?.name || 'them'} solve:** 8 ÷ 2 = ?
14. **Immediate celebration:** "${selectedChild?.name || 'You are'} a division detective!"
15. **Sticker reward** on mission map

**⏰ Mission Complete Celebration (5 minutes)**
16. **Review victories:** "${selectedChild?.name || 'You'} saved dinosaurs AND superheroes using division!"
17. **Tomorrow's teaser:** "Tomorrow we'll use division to share dinosaur food!"
18. **Victory dance** with favorite action figure

### **Frustration Prevention Built-In:**
✅ **Maximum 8 minutes per activity** before movement break
✅ **Physical manipulation** instead of abstract numbers
✅ **Immediate success** with easier problems mixed in
✅ **${selectedChild?.name || 'Their'} interests** (dinosaurs/superheroes) drive every example
✅ **Movement breaks** every few minutes

### **Key Teaching Moments:**
- **"Division means making equal groups"**
- **"How many groups can we make?"**
- **Always count the groups together, don't quiz**

### **If ${selectedChild?.name || 'They'} Get Frustrated:**
1. **Stop immediately** - "Let's rescue just 2 dinosaurs first"
2. **Make it easier** - use 6 ÷ 2 or 4 ÷ 2
3. **Add more movement** - run to get each group
4. **Celebrate small wins** - "${selectedChild?.name || 'You'} understand grouping perfectly!"

**Ready to start the Dinosaur Division Rescue? This approach turns frustrating math into an adventure game ${selectedChild?.name || 'they'} can win! 🦕⚡**

Want me to create tomorrow's follow-up lesson, or would you like variations for different division concepts?`;

        } else {
          // Generic lesson plan generator for other subjects
          response = `Here's your complete **Ready-to-Start Lesson Plan** based on everything you shared:

## 🎯 **Custom Learning Adventure - 30 Minute Session**

### **Materials You Need (5 minutes to gather):**
- Timer
- Paper and markers
- Small rewards/stickers
- Any toys related to their interests
- Space to move around

### **Session Structure:**

**⏰ Energy Warm-up (5 minutes)**
- Start with movement to channel high energy
- Use their favorite characters as motivation
- Set clear, short goals they can achieve

**⏰ Core Learning (15 minutes in 5-minute chunks)**
- Break into 3 short segments
- Movement breaks between each segment
- Use hands-on activities, not worksheets
- Connect to their interests throughout

**⏰ Success Celebration (10 minutes)**
- Review what they accomplished
- Physical celebration (dance, high-fives)
- Plan tomorrow's adventure
- End on a high note

### **Key Success Strategies:**
✅ **Never go longer than 5-7 minutes** without a movement break
✅ **Use their interests** to make examples relatable
✅ **Celebrate small wins** immediately
✅ **Keep it physical and hands-on**
✅ **Stop before frustration builds**

Would you like me to create a more specific lesson plan for the exact subject you're working on? Just let me know what skill you want to focus on and I'll design the complete activity! 🌟`;
        }

      } else {
        response = `I'd love to create a complete, ready-to-use lesson plan for ${selectedChild?.name || 'your child'}! To design the perfect activity that you can start immediately, help me understand:

🎯 **Quick Planning Questions:**
1. **Subject focus:** What specific skill needs work? (like "addition facts" or "reading comprehension" or "staying in seat")

2. **Time available:** How long can you dedicate? (15 min, 30 min, 45 min?)

3. **Space:** Where will you do this? (kitchen table, living room floor, outside?)

4. **Favorites & mood:** What does ${selectedChild?.name || 'your child'} love? And how are they feeling right now? (dinosaurs, superheroes, excited, frustrated, calm?)

5. **Energy level:** Are they usually high-energy or more calm and focused?

Once I know these details, I'll create a complete lesson plan with:
📋 Exact materials list (things you already have at home)
⏰ Minute-by-minute timing
📝 Word-for-word scripts for tricky parts
🎯 Clear learning goals
🏆 Built-in rewards and celebrations
🔄 Tomorrow's follow-up activity

Just give me those 5 details and I'll have your custom lesson plan ready in seconds! 😊`;
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

  const handleSaveConversation = () => {
    if (onSaveConversation && selectedChild && messages.length > 0) {
      onSaveConversation({
        childId: selectedChild.id,
        title: conversationTitle || `Lesson Plan - ${new Date().toLocaleDateString()}`,
        messages: messages,
        isFavorite: false,
        tags: [selectedChild.subjects[0] || 'general']
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
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
                <h1 className="font-semibold text-gray-800">
                  {selectedChild ? `${selectedChild.name}'s Lesson Planner` : 'Lesson Plan Creator'}
                </h1>
                <p className="text-sm text-gray-600">Ready-to-use activities designed for your child</p>
              </div>
            </div>
          </div>
          {selectedChild && messages.length > 1 && (
            <div className="flex gap-2">
              <button
                onClick={handleSaveConversation}
                className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                <Heart size={16} />
                Save Lesson
              </button>
            </div>
          )}
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
                  <BookOpen className="text-white" size={16} />
                </div>
              )}
              <div
                className={`max-w-3xl px-4 py-3 rounded-2xl ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white ml-12'
                    : 'bg-white/80 backdrop-blur-sm text-gray-800 border border-white/20 shadow-sm'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
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
                <BookOpen className="text-white" size={16} />
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
              placeholder={`Tell me about ${selectedChild?.name || 'your child'}'s learning needs and I'll create a complete lesson plan you can use today...`}
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
