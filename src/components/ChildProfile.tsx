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
  const ageGroups = [
    { id: 'early-elementary', label: 'Early Elementary (5-7)' },
    { id: 'elementary', label: 'Elementary (8-10)' },
    { id: 'middle-school', label: 'Middle School (11-13)' },
    { id: 'high-school', label: 'High School (14-18)' },
    { id: 'college', label: 'College (18+)' }
  ];

  const getAgeGroupLabel = (ageGroupId: string) => 
    ageGroups.find(a => a.id === ageGroupId)?.label || ageGroupId;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="text-white sm:w-5 sm:h-5" size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 truncate">{child.name}</h3>
            <p className="text-xs sm:text-sm text-gray-500">
              Created {child.createdAt.toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <button
            onClick={() => onEdit(child)}
            className="p-1 sm:p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit Profile"
          >
            <Edit2 size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>
          <button
            onClick={() => onDelete(child.id)}
            className="p-1 sm:p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Profile"
          >
            <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Users size={14} className="text-gray-600 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm font-medium text-gray-700">Age Group</span>
          </div>
          <span className="text-xs sm:text-sm text-gray-600">{getAgeGroupLabel(child.ageGroup)}</span>
        </div>

        {child.subjects && child.subjects.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen size={14} className="text-gray-600 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm font-medium text-gray-700">Subjects</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {child.subjects.map(subject => (
                <span
                  key={subject}
                  className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                >
                  {subject}
                </span>
              ))}
            </div>
          </div>
        )}

        {child.challenges && child.challenges.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Brain size={14} className="text-gray-600 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm font-medium text-gray-700">Learning Challenges</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {child.challenges.map(challenge => (
                <span
                  key={challenge}
                  className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full"
                >
                  {challenge}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => onSelect(child)}
        className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white py-2 px-4 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base"
      >
        Start Learning Session
      </button>
    </div>
  );
};

export default ChildProfile;
