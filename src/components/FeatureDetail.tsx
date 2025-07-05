import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Brain, Users, BookOpen, MessageCircle, CheckCircle, Star, Lightbulb } from 'lucide-react';

interface FeatureDetailProps {
  featureId: string;
  onBack: () => void;
  onGetStarted: () => void;
}

const FeatureDetail: React.FC<FeatureDetailProps> = ({ featureId, onBack, onGetStarted }) => {
  const features = {
    'ai-interactive-learning': {
      title: 'AI Interactive Learning',
      subtitle: 'Personalized AI conversations and activities that adapt to your child',
      icon: Brain,
      color: 'purple',
      description: 'Our advanced AI technology creates personalized learning experiences that adapt to your child\'s unique needs, learning style, and pace through engaging conversations and interactive activities.',
      benefits: [
        'Adapts to your child\'s learning style and pace',
        'Creates personalized lesson plans and activities',
        'Provides real-time feedback and support',
        'Engages in natural conversations about learning',
        'Makes learning fun through interactive experiences'
      ],
      examples: [
        'AI analyzes your child\'s responses to understand their strengths and challenges',
        'Creates custom worksheets and activities based on their interests',
        'Engages in natural conversations about complex topics',
        'Provides step-by-step guidance for complex problems'
      ],
      ctaText: 'Ready to give your child personalized AI-powered learning?'
    },
    'parent-support': {
      title: 'Parent Support',
      subtitle: 'Resources and guidance to help you support your child\'s learning',
      icon: Users,
      color: 'green',
      description: 'We provide comprehensive support for parents, including resources, guidance, and tools to help you effectively support your child\'s learning journey.',
      benefits: [
        'Access to expert educational resources and guidance',
        'Tools to track and support your child\'s progress',
        'Community forum for connecting with other parents',
        'Strategies for managing learning challenges',
        'Regular insights into your child\'s learning patterns'
      ],
      examples: [
        'Detailed progress reports and learning analytics',
        'Community forum for sharing experiences and advice',
        'Resource library with educational strategies and tips',
        'Direct access to learning specialists and support'
      ],
      ctaText: 'Ready to get the support you need to help your child succeed?'
    },
    'personalized-learning-setup': {
      title: 'Personalized Learning Setup',
      subtitle: 'Create your child\'s learning profile to unlock personalized experiences',
      icon: BookOpen,
      color: 'blue',
      description: 'Set up your child\'s learning profile to unlock personalized educational experiences tailored to their unique needs, interests, and learning style.',
      benefits: [
        'Create detailed learning profiles for each child',
        'Track subjects, age groups, and learning challenges',
        'Generate personalized learning recommendations',
        'Adapt content to individual learning preferences',
        'Support for various learning differences and needs'
      ],
      examples: [
        'Set up profiles with specific subjects and age groups',
        'Configure learning challenges and support needs',
        'Generate personalized lesson plans and activities',
        'Track progress across different learning areas'
      ],
      ctaText: 'Ready to create a personalized learning profile for your child?'
    },
    'chat-history': {
      title: 'Chat History',
      subtitle: 'Review and continue previous learning conversations with your child',
      icon: MessageCircle,
      color: 'orange',
      description: 'Access and review all your previous learning conversations with your child. Continue where you left off, revisit important concepts, and track your child\'s learning progress over time.',
      benefits: [
        'Review and continue previous learning sessions',
        'Track learning progress over time',
        'Revisit important concepts and explanations',
        'Save favorite conversations for future reference',
        'Search through past conversations by topic or date'
      ],
      examples: [
        'Continue a math lesson from last week',
        'Review a science explanation your child found helpful',
        'Find previous practice problems and activities',
        'Track how your child\'s understanding has evolved'
      ],
      ctaText: 'Ready to review and continue your child\'s learning journey?'
    }
  };

  const feature = features[featureId as keyof typeof features];
  const IconComponent = feature.icon;

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      orange: 'bg-orange-100 text-orange-600'
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="hidden sm:inline">Back to Features</span>
            <span className="sm:hidden">Back</span>
          </button>
        </div>

        {/* Feature Content */}
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${getColorClasses(feature.color)}`}>
              <IconComponent size={32} className="sm:w-8 sm:h-8" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
              {feature.title}
            </h1>
            <p className="text-lg sm:text-xl text-gray-600">
              {feature.subtitle}
            </p>
          </div>

          {/* Description */}
          <div className="mb-8">
            <p className="text-gray-700 text-base sm:text-lg leading-relaxed">
              {feature.description}
            </p>
          </div>

          {/* Benefits */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Star className="text-yellow-500" size={20} />
              Key Benefits
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {feature.benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={16} />
                  <span className="text-gray-700 text-sm sm:text-base">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Examples */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Lightbulb className="text-blue-500" size={20} />
              How It Works
            </h2>
            <div className="space-y-3">
              {feature.examples.map((example, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 text-sm sm:text-base">{example}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center pt-6 border-t border-gray-200">
            <p className="text-gray-600 mb-4 text-sm sm:text-base">
              {feature.ctaText}
            </p>
            <Button
              onClick={onGetStarted}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
            >
              Get Started Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureDetail; 