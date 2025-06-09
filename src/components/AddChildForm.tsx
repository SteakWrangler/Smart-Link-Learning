
import React, { useState } from 'react';
import { X, BookOpen, Users, Brain } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface AddChildFormProps {
  onSave: () => void;
  onCancel: () => void;
}

const AddChildForm: React.FC<AddChildFormProps> = ({
  onSave,
  onCancel
}) => {
  const { profile } = useAuth();
  const [name, setName] = useState('');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('');

  const ageGroups = [
    { id: 'early-elementary', label: 'Early Elementary (5-7)', color: 'bg-pink-100 text-pink-700' },
    { id: 'elementary', label: 'Elementary (8-10)', color: 'bg-indigo-100 text-indigo-700' },
    { id: 'middle-school', label: 'Middle School (11-13)', color: 'bg-teal-100 text-teal-700' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && selectedAgeGroup && profile) {
      try {
        const { error } = await supabase
          .from('children')
          .insert({
            parent_id: profile.id,
            name: name.trim(),
            age_group: selectedAgeGroup
          });

        if (error) throw error;
        onSave();
      } catch (error) {
        console.error('Error adding child:', error);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Add New Child</h2>
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
              Child's Name
            </label>
            <input
              id="childName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your child's name"
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
              disabled={!name.trim() || !selectedAgeGroup}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-lg hover:from-blue-600 hover:to-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Add Child
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddChildForm;
