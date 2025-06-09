
import React from 'react';
import { BookOpen, Users, Brain } from 'lucide-react';
import { Child } from '@/types/database';

interface CategorySelectorProps {
  onCategoriesSelected: (categories: {
    subject: string;
    ageGroup: string;
    challenge: string;
  }) => void;
  onBack: () => void;
  selectedChild: Child;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  onCategoriesSelected,
  onBack,
  selectedChild
}) => {
  const [selectedCategories, setSelectedCategories] = React.useState({
    subject: '',
    ageGroup: '',
    challenge: ''
  });

  const handleCategoryChange = (type: string, value: string) => {
    const updated = { ...selectedCategories, [type]: value };
    setSelectedCategories(updated);
    
    // Auto-proceed when all categories are selected
    if (updated.subject && updated.ageGroup && updated.challenge) {
      onCategoriesSelected(updated);
    }
  };

  const subjects = [
    { id: 'math', label: 'Math', color: 'bg-blue-100 text-blue-700' },
    { id: 'reading', label: 'Reading', color: 'bg-green-100 text-green-700' },
    { id: 'writing', label: 'Writing', color: 'bg-purple-100 text-purple-700' },
    { id: 'science', label: 'Science', color: 'bg-orange-100 text-orange-700' },
    { id: 'social-studies', label: 'Social Studies', color: 'bg-red-100 text-red-700' }
  ];

  const ageGroups = [
    { id: 'early-elementary', label: 'Early Elementary (5-7)', color: 'bg-pink-100 text-pink-700' },
    { id: 'elementary', label: 'Elementary (8-10)', color: 'bg-indigo-100 text-indigo-700' },
    { id: 'middle-school', label: 'Middle School (11-13)', color: 'bg-teal-100 text-teal-700' }
  ];

  const challenges = [
    { id: 'adhd-focus', label: 'ADHD/Focus Issues', color: 'bg-yellow-100 text-yellow-700' },
    { id: 'dyslexia', label: 'Dyslexia', color: 'bg-rose-100 text-rose-700' },
    { id: 'processing-delays', label: 'Processing Delays', color: 'bg-cyan-100 text-cyan-700' },
    { id: 'math-anxiety', label: 'Math Anxiety', color: 'bg-amber-100 text-amber-700' },
    { id: 'general-support', label: 'General Learning Support', color: 'bg-lime-100 text-lime-700' }
  ];

  const CategorySection = ({ 
    title, 
    icon: Icon, 
    items, 
    selectedValue, 
    categoryType 
  }: {
    title: string;
    icon: React.ComponentType<any>;
    items: Array<{ id: string; label: string; color: string }>;
    selectedValue: string;
    categoryType: string;
  }) => (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="text-gray-600" size={20} />
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => handleCategoryChange(categoryType, item.id)}
            className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 border-2 ${
              selectedValue === item.id
                ? `${item.color} border-current shadow-md scale-105`
                : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Choose Learning Focus for {selectedChild.name}</h1>
            <p className="text-gray-600">Select the subject, age group, and any learning challenges</p>
          </div>
        </div>

        <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
          <CategorySection
            title="Subject Area"
            icon={BookOpen}
            items={subjects}
            selectedValue={selectedCategories.subject}
            categoryType="subject"
          />
          
          <CategorySection
            title="Age Group"
            icon={Users}
            items={ageGroups}
            selectedValue={selectedCategories.ageGroup}
            categoryType="ageGroup"
          />
          
          <CategorySection
            title="Learning Challenge"
            icon={Brain}
            items={challenges}
            selectedValue={selectedCategories.challenge}
            categoryType="challenge"
          />
        </div>
      </div>
    </div>
  );
};

export default CategorySelector;
