import React from 'react';
import { BookOpen, Users, Brain, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CategorySelectorProps {
  selectedCategories: {
    subject: string;
    ageGroup: string;
    challenge: string;
  };
  onCategoryChange: (type: string, value: string) => void;
  onBack: () => void;
  onCategoriesSelected: (categories: any) => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedCategories,
  onCategoryChange,
  onBack,
  onCategoriesSelected
}) => {
  const subjects = [
    { id: 'math', label: 'Math', color: 'bg-blue-100 text-blue-700' },
    { id: 'reading', label: 'Reading', color: 'bg-green-100 text-green-700' },
    { id: 'writing', label: 'Writing', color: 'bg-purple-100 text-purple-700' },
    { id: 'science', label: 'Science', color: 'bg-orange-100 text-orange-700' },
    { id: 'social-studies', label: 'Social Studies', color: 'bg-red-100 text-red-700' }
  ];

  const grades = [
    { id: 'kindergarten', label: 'Kindergarten', group: 'Elementary School' },
    { id: '1st-grade', label: '1st Grade', group: 'Elementary School' },
    { id: '2nd-grade', label: '2nd Grade', group: 'Elementary School' },
    { id: '3rd-grade', label: '3rd Grade', group: 'Elementary School' },
    { id: '4th-grade', label: '4th Grade', group: 'Elementary School' },
    { id: '5th-grade', label: '5th Grade', group: 'Elementary School' },
    { id: '6th-grade', label: '6th Grade', group: 'Middle School' },
    { id: '7th-grade', label: '7th Grade', group: 'Middle School' },
    { id: '8th-grade', label: '8th Grade', group: 'Middle School' },
    { id: '9th-grade', label: '9th Grade', group: 'High School' },
    { id: '10th-grade', label: '10th Grade', group: 'High School' },
    { id: '11th-grade', label: '11th Grade', group: 'High School' },
    { id: '12th-grade', label: '12th Grade', group: 'High School' },
    { id: 'college', label: 'College', group: 'Post-Secondary' }
  ];

  const challenges = [
    { id: 'adhd-focus', label: 'ADHD/Focus Issues', color: 'bg-yellow-100 text-yellow-700' },
    { id: 'dyslexia', label: 'Dyslexia', color: 'bg-rose-100 text-rose-700' },
    { id: 'processing-delays', label: 'Processing Delays', color: 'bg-cyan-100 text-cyan-700' },
    { id: 'math-anxiety', label: 'Math Anxiety', color: 'bg-amber-100 text-amber-700' },
    { id: 'autism-spectrum', label: 'Autism Spectrum (ASD)', color: 'bg-blue-100 text-blue-700' },
    { id: 'english-language-learner', label: 'English Language Learner', color: 'bg-green-100 text-green-700' },
    { id: 'language-delays', label: 'Language/Speech Delays', color: 'bg-purple-100 text-purple-700' },
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
            onClick={() => onCategoryChange(categoryType, item.id)}
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

  const GradeDropdownSection = ({ 
    title, 
    icon: Icon, 
    selectedValue, 
    categoryType 
  }: {
    title: string;
    icon: React.ComponentType<any>;
    selectedValue: string;
    categoryType: string;
  }) => (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="text-gray-600" size={20} />
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      </div>
      <Select value={selectedValue} onValueChange={(value) => onCategoryChange(categoryType, value)}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select grade level" />
        </SelectTrigger>
        <SelectContent>
          {['Elementary School', 'Middle School', 'High School', 'Post-Secondary'].map(group => {
            const groupGrades = grades.filter(grade => grade.group === group);
            return groupGrades.length > 0 ? (
              <div key={group}>
                <div className="px-2 py-1.5 text-sm font-semibold text-gray-500 bg-gray-50">
                  {group}
                </div>
                {groupGrades.map(grade => (
                  <SelectItem key={grade.id} value={grade.id}>
                    {grade.label}
                  </SelectItem>
                ))}
              </div>
            ) : null;
          })}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <Button
            onClick={() => onCategoriesSelected(selectedCategories)}
            disabled={!selectedCategories.subject || !selectedCategories.ageGroup || !selectedCategories.challenge}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
          >
            Continue to Chat
          </Button>
        </div>

        <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
          <CategorySection
            title="Subject Area"
            icon={BookOpen}
            items={subjects}
            selectedValue={selectedCategories.subject}
            categoryType="subject"
          />
          
          <GradeDropdownSection
            title="Grade Level"
            icon={Users}
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
