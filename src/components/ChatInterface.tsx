
import React, { useState, useRef, useEffect } from 'react';
import { Send, ArrowLeft, Bot, User, Clock, Users, BookOpen } from 'lucide-react';

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

      // If user provided comprehensive planning info, generate a lesson plan
      if (hasSubjectInfo && (hasTimeInfo || hasEnergyInfo || hasInterestInfo)) {
        
        // Division lesson plan with dinosaur theme for high-energy child
        if (userMessage.toLowerCase().includes('division')) {
          response = `Perfect! Here's your **"Dinosaur Division Adventure"** - designed specifically for your high-energy son who loves dinosaurs and action figures:

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
3. **Give your son the pile of 20 dinosaurs**
4. **Say: "Put exactly 4 dinosaurs on each landing pad"**
5. **Count together:** "1 pad, 2 pads, 3 pads, 4 pads, 5 pads!"
6. **Big discovery:** "20 ÷ 4 = 5 helicopter trips!"

**⏰ Action Figure Division (8 minutes)**
7. **New mission:** "12 superheroes need to form teams of 3"
8. **Physical sorting:** Let him group 12 action figures into teams of 3
9. **Count teams together:** "1 team, 2 teams, 3 teams, 4 teams!"
10. **Write it down:** "12 ÷ 3 = 4 teams"
11. **Movement break:** Act out each superhero team's special move!

**⏰ Quick Success Round (4 minutes)**
12. **Easier division for confidence:** "8 dinosaurs, 2 per rescue boat"
13. **Let him solve:** 8 ÷ 2 = ?
14. **Immediate celebration:** "You're a division detective!"
15. **Sticker reward** on mission map

**⏰ Mission Complete Celebration (5 minutes)**
16. **Review victories:** "You saved dinosaurs AND superheroes using division!"
17. **Tomorrow's teaser:** "Tomorrow we'll use division to share dinosaur food!"
18. **Victory dance** with favorite action figure

### **Frustration Prevention Built-In:**
✅ **Maximum 8 minutes per activity** before movement break
✅ **Physical manipulation** instead of abstract numbers
✅ **Immediate success** with easier problems mixed in
✅ **His interests** (dinosaurs/superheroes) drive every example
✅ **Movement breaks** every few minutes

### **Key Teaching Moments:**
- **"Division means making equal groups"**
- **"How many groups can we make?"**
- **Always count the groups together, don't quiz**

### **If He Gets Frustrated:**
1. **Stop immediately** - "Let's rescue just 2 dinosaurs first"
2. **Make it easier** - use 6 ÷ 2 or 4 ÷ 2
3. **Add more movement** - run to get each group
4. **Celebrate small wins** - "You understand grouping perfectly!"

**Ready to start the Dinosaur Division Rescue? This approach turns frustrating math into an adventure game he can win! 🦕⚡**

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

      } else if (userMessage.toLowerCase().includes('math') || userMessage.toLowerCase().includes('addition') || userMessage.toLowerCase().includes('subtraction')) {
        response = `Here's a complete **Math Adventure Lesson Plan** ready for you to use today:

## 🎯 **"Kitchen Math Explorer" - 45 Minute Lesson**

### **Materials Needed:**
- 2 cups flour
- 1 cup water
- Measuring cups (1/4, 1/2, 1 cup)
- Large mixing bowl
- Ruler or measuring tape
- Timer
- Paper and pencils
- Small treats for rewards

### **Lesson Structure:**

**⏰ Warm-up (10 minutes)**
1. Start with a "Math Detective" hunt around the kitchen
2. Have your child find 5 round objects and 5 square objects
3. Count them together and write the numbers down

**⏰ Main Activity - Fraction Pizza (25 minutes)**
1. **Step 1 (5 min):** Mix flour and water to make play dough
   - Measure 1 cup flour together, let them pour
   - Add 1/2 cup water, discuss "half"
2. **Step 2 (10 min):** Roll into a circle for "pizza"
   - Cut into 2 pieces - "These are halves!"
   - Cut each half in half - "Now we have quarters!"
   - Let them arrange and count: "How many quarters make a whole?"
3. **Step 3 (10 min):** Pizza topping math
   - Add pretend toppings in patterns
   - "Put 3 pepperonis on each quarter - how many total?"
   - Practice addition: 3+3+3+3 = ?

**⏰ Cool Down (10 minutes)**
- Clean up while skip counting by 2s, 5s, or 10s
- Review what fractions they learned
- Give a small celebration treat

### **Learning Goals Achieved:**
✅ Fractions (halves, quarters, wholes)
✅ Basic addition and multiplication
✅ Measurement and counting
✅ Following multi-step instructions

### **Extension for Tomorrow:**
Use the same dough to make different shapes and practice geometry!

Would you like me to create another lesson plan for a different math concept, or shall we try a different subject? 😊`;

      } else if (userMessage.toLowerCase().includes('reading') || userMessage.toLowerCase().includes('dyslexia')) {
        response = `Here's your **Reading Adventure Lesson Plan** - completely prepared and ready to go:

## 📚 **"Detective Story Builder" - 40 Minute Lesson**

### **Materials Ready:**
- 10 index cards
- Colored markers/crayons
- A simple mystery book or story
- Small magnifying glass (toy or real)
- Timer
- Sticker rewards

### **Complete Lesson Plan:**

**⏰ Mystery Warm-Up (8 minutes)**
1. **Minutes 1-3:** Put on "detective hats" (real or pretend)
2. **Minutes 4-6:** Look around room with magnifying glass for letter clues
   - Hide cards with letters B, A, T beforehand
   - When found, sound out each letter together
3. **Minutes 7-8:** Arrange letters to spell "BAT" - celebrate discovery!

**⏰ Story Detective Work (22 minutes)**
1. **Reading Together (10 min):**
   - Choose a 2-3 page mystery story
   - You read first paragraph aloud
   - Child reads next sentence (help with difficult words)
   - Take turns, keep it fun and pressure-free

2. **Story Mapping (7 min):**
   - Draw the main character on index card
   - Draw the problem on another card
   - Draw the solution on third card
   - Arrange in order while retelling story

3. **Word Detective Game (5 min):**
   - Find 3 "action words" in the story (ran, jumped, looked)
   - Act out each word together
   - Write them on cards for word collection

**⏰ Creative Wrap-Up (10 minutes)**
- Create their own 3-sentence mystery
- Example template: "The ____ was missing. I looked ____. I found it ____!"
- Draw a picture of their mystery
- Read their story aloud like a real detective

### **Success Markers:**
✅ Practiced phonics in natural way
✅ Built reading comprehension
✅ Created personal connection to story
✅ Boosted confidence through success

### **For Struggling Readers:**
- Let them point to words while you read
- Use different voices for characters
- Pause to predict what happens next

Ready to be reading detectives? Want another themed lesson plan? 🔍`;

      } else if (userMessage.toLowerCase().includes('focus') || userMessage.toLowerCase().includes('adhd')) {
        response = `Here's your **Focus-Friendly Learning Plan** designed specifically for active minds:

## 🎯 **"Movement Learning Lab" - 30 Minute Session**

### **Setup (5 minutes before starting):**
- Clear 6x6 foot space
- Set up 4 "stations" with masking tape squares
- Have timer, fidget ball, and worksheet ready
- Prepare movement songs playlist

### **The Complete Session:**

**⏰ Energy Release Start (5 minutes)**
1. **Jumping Jacks Learning (2 min):**
   - Count by 2s while doing jumping jacks
   - "2, 4, 6, 8... let's count and concentrate!"
2. **Focus Breathing (1 min):**
   - "Smell the flower" (deep breath in)
   - "Blow out the candle" (long breath out)
   - Repeat 5 times
3. **Body Check (2 min):**
   - Wiggle everything out - fingers, toes, shoulders
   - End in "statue pose" for 10 seconds

**⏰ Station Learning Circuit (20 minutes - 5 min each)**

**Station 1: Standing Desk Work**
- Use tall table or counter
- 5 math problems while standing
- Fidget ball in non-writing hand
- Timer set for 5 minutes

**Station 2: Floor Work**
- Lie on stomach, prop on elbows
- Practice writing letters in sandbox/rice tray
- Engages core muscles for focus
- Very calming position

**Station 3: Balance Challenge**
- Stand on one foot while reciting alphabet
- Switch feet halfway through
- If they lose balance, start that letter again
- Makes brain work harder = better focus

**Station 4: Quiet Corner**
- Soft pillows and dim lighting
- Read quietly for 5 minutes
- Weighted lap pad if available
- This is their "reset" station

**⏰ Celebration Finish (5 minutes)**
- Dance to one favorite song
- Talk about what they accomplished
- Choose tomorrow's fidget tool
- High fives and specific praise

### **Why This Works:**
✅ Burns excess energy first
✅ Changes position every 5 minutes
✅ Provides sensory input for regulation
✅ Builds success momentum

### **Quick Modifications:**
- Too wiggly? Add more movement breaks
- Too tired? Start with quiet station
- Having great day? Extend successful stations

Want me to create tomorrow's session plan with different activities? 🌟`;

      } else {
        response = `I'd love to create a complete, ready-to-use lesson plan for you! To design the perfect activity that you can start immediately, help me understand:

🎯 **Quick Planning Questions:**
1. **Subject focus:** What specific skill needs work? (like "addition facts" or "reading comprehension" or "staying in seat")

2. **Time available:** How long can you dedicate? (15 min, 30 min, 45 min?)

3. **Space:** Where will you do this? (kitchen table, living room floor, outside?)

4. **Your child's favorites:** What do they love? (animals, superheroes, building, music, cooking?)

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
              <h1 className="font-semibold text-gray-800">Lesson Plan Creator</h1>
              <p className="text-sm text-gray-600">Ready-to-use activities designed for your child</p>
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
              placeholder="Tell me about your child's learning needs and I'll create a complete lesson plan you can use today..."
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
