import React, { useState } from 'react';
import { X, BookOpen, Users, Brain } from 'lucide-react';
import { Child } from '../types';
import { useAuth } from '../hooks/useAuth';

interface AddChildFormProps {
  onSave: (child: Omit<Child, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
  editingChild?: Child;
}

const AddChildForm: React.FC<AddChildFormProps> = ({
  onSave,
  onCancel,
  editingChild
}) => {
  const { user } = useAuth();
  const [name, setName] = useState(editingChild?.name || '');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(editingChild?.subjects || []);
  const [selectedAgeGroup, setSelectedAgeGroup] = useState(editingChild?.ageGroup || '');
  const [selectedChallenges, setSelectedChallenges] = useState<string[]>(editingChild?.challenges || []);

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
    { id: 'middle-school', label: 'Middle School (11-13)', color: 'bg-teal-100 text-teal-700' },
    { id: 'high-school', label: 'High School (14-18)', color: 'bg-purple-100 text-purple-700' },
    { id: 'college', label: 'College (18+)', color: 'bg-amber-100 text-amber-700' }
  ];

  const challenges = [
    { id: 'adhd-focus', label: 'ADHD/Focus Issues', color: 'bg-yellow-100 text-yellow-700' },
    { id: 'dyslexia', label: 'Dyslexia', color: 'bg-rose-100 text-rose-700' },
    { id: 'processing-delays', label: 'Processing Delays', color: 'bg-cyan-100 text-cyan-700' },
    { id: 'math-anxiety', label: 'Math Anxiety', color: 'bg-amber-100 text-amber-700' },
    { id: 'general-support', label: 'General Learning Support', color: 'bg-lime-100 text-lime-700' }
  ];

  const handleSubjectToggle = (subjectId: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subjectId) 
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleChallengeToggle = (challengeId: string) => {
    setSelectedChallenges(prev => 
      prev.includes(challengeId) 
        ? prev.filter(id => id !== challengeId)
        : [...prev, challengeId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && selectedSubjects.length > 0 && selectedAgeGroup && selectedChallenges.length > 0 && user?.id) {
      console.log('Submitting child with parent_id:', user.id);
      
      // Convert IDs to labels for database storage
      const subjectLabels = selectedSubjects.map(subjectId => 
        subjects.find(s => s.id === subjectId)?.label || subjectId
      );
      const challengeLabels = selectedChallenges.map(challengeId => 
        challenges.find(c => c.id === challengeId)?.label || challengeId
      );

      onSave({
        name: name.trim(),
        subjects: subjectLabels,
        ageGroup: selectedAgeGroup,
        challenges: challengeLabels,
        parent_id: user.id
      });
    } else {
      console.error('Missing required fields or user not authenticated');
    }
  };

  const MultiSelectSection = ({ 
    title, 
    icon: Icon, 
    items, 
    selectedItems, 
    onToggle 
  }: {
    title: string;
    icon: React.ComponentType<any>;
    items: Array<{ id: string; label: string; color: string }>;
    selectedItems: string[];
    onToggle: (id: string) => void;
  }) => (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="text-gray-600" size={20} />
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onToggle(item.id)}
            className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 border-2 ${
              selectedItems.includes(item.id)
                ? `${item.color} border-current shadow-md`
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            {editingChild ? 'Edit Child Profile' : 'Add Student'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="childName" className="block text-sm font-medium text-gray-700 mb-2">
              Student's Name
            </label>
            <input
              id="childName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your student's name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="text-gray-600" size={20} />
              <h3 className="text-lg font-semibold text-gray-800">Age Group</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {ageGroups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setSelectedAgeGroup(group.id)}
                  className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 border-2 ${
                    selectedAgeGroup === group.id
                      ? `${group.color} border-current shadow-md`
                      : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {group.label}
                </button>
              ))}
            </div>
          </div>

          <MultiSelectSection
            title="Subject Areas (Select all that apply)"
            icon={BookOpen}
            items={subjects}
            selectedItems={selectedSubjects}
            onToggle={handleSubjectToggle}
          />

          <MultiSelectSection
            title="Learning Challenges (Select all that apply)"
            icon={Brain}
            items={challenges}
            selectedItems={selectedChallenges}
            onToggle={handleChallengeToggle}
          />

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || selectedSubjects.length === 0 || !selectedAgeGroup || selectedChallenges.length === 0 || !user?.id}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-lg hover:from-blue-600 hover:to-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {editingChild ? 'Update Student' : 'Add Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddChildForm;
