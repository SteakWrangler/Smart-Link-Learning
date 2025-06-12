import React from 'react';
import { Student } from '../types/database';

interface StudentProfileProps {
  student: Student;
  onEdit: () => void;
  onDelete: () => void;
  onSelect: () => void;
  isSelected: boolean;
}

export const StudentProfile: React.FC<StudentProfileProps> = ({
  student,
  onEdit,
  onDelete,
  onSelect,
  isSelected,
}) => {
  return (
    <div
      className={`bg-white rounded-lg shadow-lg p-6 cursor-pointer transition-all duration-200 ${
        isSelected ? 'ring-2 ring-blue-500' : 'hover:shadow-xl'
      }`}
      onClick={onSelect}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold text-gray-800">{student.name}</h3>
        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="text-blue-500 hover:text-blue-600"
          >
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-red-500 hover:text-red-600"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-gray-600">
          <span className="font-medium">Age Group:</span>{' '}
          {student.age_group.charAt(0).toUpperCase() + student.age_group.slice(1)}
        </p>
        <p className="text-gray-600">
          <span className="font-medium">Created:</span>{' '}
          {new Date(student.created_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}; 