import React, { useState, useEffect } from 'react';
import { Student, Subject, Challenge } from '../types/database';

interface AddStudentFormProps {
  subjects: Subject[];
  challenges: Challenge[];
  editingStudent?: Student | null;
  onSubmit: (studentData: Partial<Student>) => Promise<void>;
  onCancel: () => void;
}

export const AddStudentForm: React.FC<AddStudentFormProps> = ({
  subjects,
  challenges,
  editingStudent,
  onSubmit,
  onCancel,
}) => {
  const [name, setName] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('');
  const [selectedChallenges, setSelectedChallenges] = useState<string[]>([]);

  useEffect(() => {
    if (editingStudent) {
      setName(editingStudent.name);
      setSelectedAgeGroup(editingStudent.age_group);
      // Note: We'll need to fetch the subjects and challenges for the student
      // when we implement the junction tables
    }
  }, [editingStudent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      name,
      age_group: selectedAgeGroup,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">
        {editingStudent ? 'Edit Student Profile' : 'Add New Student'}
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Student's Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="ageGroup" className="block text-sm font-medium text-gray-700 mb-1">
            Age Group
          </label>
          <select
            id="ageGroup"
            value={selectedAgeGroup}
            onChange={(e) => setSelectedAgeGroup(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select Age Group</option>
            <option value="elementary">Elementary (5-10)</option>
            <option value="middle">Middle School (11-13)</option>
            <option value="high">High School (14-18)</option>
          </select>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            {editingStudent ? 'Update Student' : 'Add Student'}
          </button>
        </div>
      </form>
    </div>
  );
}; 