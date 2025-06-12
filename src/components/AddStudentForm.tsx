import React, { useState } from 'react';
import { X, Users, BookOpen, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Student, Subject, Challenge } from '@/types/database';

interface AddStudentFormProps {
  onSave: (student: Student) => void;
  onCancel: () => void;
  editingStudent?: Student | null;
}

const AddStudentForm: React.FC<AddStudentFormProps> = ({
  onSave,
  onCancel,
  editingStudent
}) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(editingStudent?.name || '');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState(editingStudent?.age_group || '');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(editingStudent?.subjects || []);
  const [selectedChallenges, setSelectedChallenges] = useState<string[]>(editingStudent?.challenges || []);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);

  const ageGroups = [
    { id: 'early-elementary', label: 'Early Elementary (5-7)' },
    { id: 'elementary', label: 'Elementary (8-10)' },
    { id: 'middle-school', label: 'Middle School (11-13)' },
    { id: 'high-school', label: 'High School (14-18)' },
    { id: 'college', label: 'College (18+)' }
  ];

  React.useEffect(() => {
    fetchSubjectsAndChallenges();
  }, []);

  const fetchSubjectsAndChallenges = async () => {
    try {
      const [subjectsResult, challengesResult] = await Promise.all([
        supabase.from('subjects').select('*'),
        supabase.from('challenges').select('*')
      ]);

      if (subjectsResult.data) setSubjects(subjectsResult.data);
      if (challengesResult.data) setChallenges(challengesResult.data);
    } catch (error) {
      console.error('Error fetching subjects and challenges:', error);
      toast({
        title: "Error",
        description: "Failed to load subjects and challenges",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !name.trim() || !selectedAgeGroup || selectedSubjects.length === 0 || selectedChallenges.length === 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      let student: Student;

      if (editingStudent) {
        // Update existing student
        const { data, error } = await supabase
          .from('students')
          .update({
            name: name.trim(),
            age_group: selectedAgeGroup,
            subjects: selectedSubjects,
            challenges: selectedChallenges,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingStudent.id)
          .select()
          .single();

        if (error) throw error;
        student = { ...data, subjects: selectedSubjects, challenges: selectedChallenges };
      } else {
        // Create new student
        const { data, error } = await supabase
          .from('students')
          .insert({
            user_id: profile.id,
            name: name.trim(),
            age_group: selectedAgeGroup,
            subjects: selectedSubjects,
            challenges: selectedChallenges
          })
          .select()
          .single();

        if (error) throw error;
        student = { ...data, subjects: selectedSubjects, challenges: selectedChallenges };
      }

      toast({
        title: "Success!",
        description: `Student profile ${editingStudent ? 'updated' : 'created'} successfully.`,
      });

      onSave(student);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSubject = (subjectId: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subjectId)
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const toggleChallenge = (challengeId: string) => {
    setSelectedChallenges(prev =>
      prev.includes(challengeId)
        ? prev.filter(id => id !== challengeId)
        : [...prev, challengeId]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            {editingStudent ? 'Edit Student Profile' : 'Add New Student'}
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
            <Label htmlFor="name">Student's Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter student's name"
              required
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="text-gray-600" size={20} />
              <h3 className="text-lg font-semibold text-gray-800">Age Group</h3>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {ageGroups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setSelectedAgeGroup(group.id)}
                  className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 border-2 ${
                    selectedAgeGroup === group.id
                      ? 'bg-blue-100 text-blue-700 border-blue-300'
                      : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {group.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="text-gray-600" size={20} />
              <h3 className="text-lg font-semibold text-gray-800">Subjects to Work On</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {subjects.map((subject) => (
                <button
                  key={subject.id}
                  type="button"
                  onClick={() => toggleSubject(subject.id)}
                  className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 border-2 ${
                    selectedSubjects.includes(subject.id)
                      ? 'bg-green-100 text-green-700 border-green-300'
                      : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {subject.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Brain className="text-gray-600" size={20} />
              <h3 className="text-lg font-semibold text-gray-800">Learning Challenges</h3>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {challenges.map((challenge) => (
                <button
                  key={challenge.id}
                  type="button"
                  onClick={() => toggleChallenge(challenge.id)}
                  className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 border-2 text-left ${
                    selectedChallenges.includes(challenge.id)
                      ? 'bg-orange-100 text-orange-700 border-orange-300'
                      : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">{challenge.name}</div>
                  {challenge.description && (
                    <div className="text-xs opacity-75 mt-1">{challenge.description}</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              onClick={onCancel}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !name.trim() || selectedSubjects.length === 0 || !selectedAgeGroup || selectedChallenges.length === 0}
              className="flex-1 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
            >
              {loading ? 'Saving...' : editingStudent ? 'Update Student' : 'Add Student'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStudentForm; 