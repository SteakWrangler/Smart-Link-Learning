import React, { useState } from 'react';
import { X, BookOpen, Users, Brain } from 'lucide-react';
import { Child } from '../types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
    { id: 'asd', label: 'Autism Spectrum Disorder (ASD)', color: 'bg-blue-100 text-blue-700' },
    { id: 'ell', label: 'English Language Learners (ELL)', color: 'bg-purple-100 text-purple-700' },
    { id: 'language-delays', label: 'Language Delays', color: 'bg-indigo-100 text-indigo-700' },
    { id: 'general-support', label: 'General Learning Support', color: 'bg-lime-100 text-lime-700' }
  ];

  // Helper functions to convert labels back to IDs for editing
  const getSubjectIds = (subjectLabels: string[]) => {
    return subjectLabels.map(label => 
      subjects.find(s => s.label === label)?.id || label
    );
  };

  const getChallengeIds = (challengeLabels: string[]) => {
    return challengeLabels.map(label => 
      challenges.find(c => c.label === label)?.id || label
    );
  };

  const [name, setName] = useState(editingChild?.name || '');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
    editingChild?.subjects ? getSubjectIds(editingChild.subjects) : []
  );
  const [selectedAgeGroup, setSelectedAgeGroup] = useState(editingChild?.ageGroup || '');
  const [selectedChallenges, setSelectedChallenges] = useState<string[]>(
    editingChild?.challenges ? getChallengeIds(editingChild.challenges) : []
  );

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
    if (name.trim() && selectedSubjects.length > 0 && selectedAgeGroup && selectedChallenges.length > 0) {
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
        challenges: challengeLabels
      });
    }
  };

  // Get label for selected grade
  const getSelectedGradeLabel = () => {
    const grade = grades.find(g => g.id === selectedAgeGroup);
    return grade ? grade.label : 'Select grade level';
  };

  const MultiSelectSection = ({ 
    title, 
    icon: Icon, 
    items, 
    selectedItems, 
    onToggle 
  }: {
    title: string;
    icon: React.ComponentType<{className?: string; size?: number}>;
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
              <h3 className="text-lg font-semibold text-gray-800">Grade Level</h3>
            </div>
            <Select value={selectedAgeGroup} onValueChange={setSelectedAgeGroup}>
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
              disabled={!name.trim() || selectedSubjects.length === 0 || !selectedAgeGroup || selectedChallenges.length === 0}
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
