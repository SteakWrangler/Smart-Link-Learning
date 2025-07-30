import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FAQItem {
  question: string;
  answer: string;
  listItems?: string[];
}

const FAQ: React.FC = () => {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const faqData: FAQItem[] = [
    {
      question: "What is Smart Link Learning and what can it do for my child?",
      answer: "Smart Link Learning is an AI-powered learning platform that creates personalized educational experiences for your child. It can:",
      listItems: [
        "Generate custom lesson plans based on your child's age, subjects, and learning challenges",
        "Provide interactive conversations that adapt to your child's learning style",
        "Help with homework, test preparation, and concept explanations",
        "Support children with various learning challenges and differences",
        "Create engaging learning activities that make education fun and effective"
      ]
    },
    {
      question: "How can I get the most out of Smart Link Learning's features?",
      answer: "Here are the key ways to leverage Smart Link Learning's capabilities:",
      listItems: [
        "Document Upload: Upload your child's failed tests, homework, or study guides to help the AI understand exactly where they need help",
        "Parent Support Section: Access resources and connect with other parents facing similar challenges",
        "Community Forums: Join discussions in the Parent Support section to share experiences and get advice from other parents",
        "Conversation History: Save important learning sessions to track progress and revisit key concepts",
        "Multiple Students: Create profiles for each of your children to get personalized learning plans for each one"
      ]
    },
    {
      question: "How does Smart Link Learning protect my child's information?",
      answer: "We take privacy seriously and have implemented several security measures:",
      listItems: [
        "Row Level Security: All data is protected by database-level security policies that ensure users can only access their own information",
        "User Authentication: Secure authentication through Supabase Auth, an industry-standard solution",
        "Data Isolation: Each user's data is completely isolated from other users",
        "User Control: You have full control over your child's information and can delete it at any time",
        "No Third-Party Sharing: We do not share your child's data with third parties"
      ]
    },
    {
      question: "How does Smart Link Learning help children with learning differences?",
      answer: "Smart Link Learning is designed to support all children in their learning journey, and we're especially effective at helping students with learning challenges and differences. The AI adapts its teaching style, pace, and approach based on each child's individual needs. The platform provides:",
      listItems: [
        "Personalized learning approaches that work for students of all abilities",
        "Shorter, more focused learning sessions for children with attention challenges",
        "Multi-sensory learning approaches for different processing styles",
        "Positive reinforcement and confidence-building interactions for every student",
        "Custom strategies for specific learning difficulties when needed",
        "Flexible pacing and repetition based on individual learning needs"
      ]
    },
    {
      question: "What devices work with Smart Link Learning and how do I access my saved content?",
      answer: "Smart Link Learning works on any device with a web browser - computers, tablets, and phones. All your conversations, student profiles, and uploaded documents are automatically saved and accessible from any device. You can view your saved conversations in the Chat History section, and documents uploaded to specific conversations are accessible within those chats."
    },
    {
      question: "Where can I get help if I have questions or need support?",
      answer: "We provide multiple support options:",
      listItems: [
        "Parent Support Section: Access guides, resources, and strategies for helping your child learn",
        "Community Forums: Connect with other parents in the Parent Support section to share experiences and advice",
        "Document Manager: Upload and organize your child's learning materials for better AI assistance",
        "Conversation History: Review past sessions to see what's working and what might need adjustment"
      ]
    }
  ];

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <HelpCircle className="text-blue-500" size={32} />
          <h2 className="text-3xl font-bold text-gray-800">Frequently Asked Questions</h2>
        </div>
        <p className="text-gray-600 text-lg">
          Find answers to common questions about Smart Link Learning
        </p>
      </div>

      <div className="space-y-4">
        {faqData.map((item, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md border border-gray-200">
            <button
              onClick={() => toggleItem(index)}
              className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors rounded-lg"
            >
              <h3 className="text-lg font-semibold text-gray-800 pr-4">
                {item.question}
              </h3>
              {openItems.includes(index) ? (
                <ChevronUp className="text-gray-500 flex-shrink-0" size={20} />
              ) : (
                <ChevronDown className="text-gray-500 flex-shrink-0" size={20} />
              )}
            </button>
            
            {openItems.includes(index) && (
              <div className="px-6 pb-4">
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-gray-700 leading-relaxed mb-4">
                    {item.answer}
                  </p>
                  {item.listItems && (
                    <ul className="list-disc pl-6 space-y-2">
                      {item.listItems.map((listItem, index) => (
                        <li key={index} className="text-gray-700 leading-relaxed">
                          {listItem}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <p className="text-gray-600 mb-4">
          Still have questions? We're here to help!
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Check out the Parent Support section for additional resources and community discussions.
        </p>
        <p className="text-sm text-gray-500">
          Need additional help? Contact our team at{' '}
          <a 
            href="mailto:LinkSmartTechLLC@gmail.com" 
            className="text-blue-600 hover:text-blue-800 underline"
          >
            LinkSmartTechLLC@gmail.com
          </a>
        </p>
      </div>
    </div>
  );
};

export default FAQ; 