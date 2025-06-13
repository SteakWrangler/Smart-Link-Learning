import React, { useState } from 'react';
import { User, Edit2, Trash2, BookOpen, Users, Brain } from 'lucide-react';
import { Child } from '../types';
import { Button } from '@/components/ui/button';

interface ChildProfileProps {
  child: Child;
  onEdit: (child: Child) => void;
  onDelete: (childId: string) => void;
  onSelect: (child: Child) => void;
}

const ChildProfile: React.FC<ChildProfileProps> = ({
  child,
  onEdit,
  onDelete,
  onSelect
}) => {
  const subjects = [
    { id: 'math', label: 'Math', color: 'bg-blue-100 text-blue-700' },
    { id: 'reading', label: 'Reading', color: 'bg-green-100 text-green-700' },
    { id: 'writing', label: 'Writing', color: 'bg-purple-100 text-purple-700' },
    { id: 'science', label: 'Science', color: 'bg-orange-100 text-orange-700' },
    { id: 'social-studies', label: 'Social Studies', color: 'bg-red-100 text-red-700' }
  ];

  const ageGroups = [
    { id: 'early-elementary', label: 'Early Elementary (5-7)' },
    { id: 'elementary', label: 'Elementary (8-10)' },
    { id: 'middle-school', label: 'Middle School (11-13)' },
    { id: 'high-school', label: 'High School (14-18)' },
    { id: 'college', label: 'College (18+)' }
  ];

  const challenges = [
    { id: 'adhd-focus', label: 'ADHD/Focus Issues' },
    { id: 'dyslexia', label: 'Dyslexia' },
    { id: 'processing-delays', label: 'Processing Delays' },
    { id: 'math-anxiety', label: 'Math Anxiety' },
    { id: 'general-support', label: 'General Learning Support' }
  ];

  const getSubjectLabel = (subjectId: string) => 
    subjects.find(s => s.id === subjectId)?.label || subjectId;
  
  const getAgeGroupLabel = (ageGroupId: string) => 
    ageGroups.find(a => a.id === ageGroupId)?.label || ageGroupId;
  
  const getChallengeLabel = (challengeId: string) => 
    challenges.find(c => c.id === challengeId)?.label || challengeId;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
            <User className="text-white" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">{child.name}</h3>
            <p className="text-sm text-gray-500">
              Created {child.createdAt.toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => onEdit(child)} variant="outline" className="flex-1">
            Edit Student
          </Button>
          <Button onClick={() => onDelete(child.id)} variant="destructive" className="flex-1">
            Delete Student
          </Button>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} className="text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Age Group</span>
          </div>
          <span className="text-sm text-gray-600">{getAgeGroupLabel(child.ageGroup)}</span>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={16} className="text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Subjects</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {child.subjects.map(subject => (
              <span
                key={subject}
                className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
              >
                {getSubjectLabel(subject)}
              </span>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Brain size={16} className="text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Learning Challenges</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {child.challenges.map(challenge => (
              <span
                key={challenge}
                className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full"
              >
                {getChallengeLabel(challenge)}
              </span>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={() => onSelect(child)}
        className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white py-2 px-4 rounded-lg font-medium transition-all duration-200"
      >
        Start Learning Session
      </button>
    </div>
  );
};

export default ChildProfile;
