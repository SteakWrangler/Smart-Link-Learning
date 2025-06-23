
import React, { useState } from 'react';
import { X, BookOpen, Users, Brain } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { StudentProfile, Subject, Challenge } from '@/types/database';

interface StudentProfileFormProps {
  onSave: (profile: StudentProfile) => void;
  onCancel: () => void;
  editingProfile?: StudentProfile | null;
  subjects: Subject[];
  challenges: Challenge[];
}

const StudentProfileForm: React.FC<StudentProfileFormProps> = ({
  onSave,
  onCancel,
  editingProfile,
  subjects,
  challenges
}) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(editingProfile?.name || '');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState(editingProfile?.age_group || '');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedChallenges, setSelectedChallenges] = useState<string[]>([]);

  const ageGroups = [
    { id: 'early-elementary', label: 'Early Elementary (5-7)' },
    { id: 'elementary', label: 'Elementary (8-10)' },
    { id: 'middle-school', label: 'Middle School (11-13)' },
    { id: 'high-school', label: 'High School (14-18)' },
    { id: 'college', label: 'College (18+)' }
  ];

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
      let studentProfile: StudentProfile;

      if (editingProfile) {
        // Update existing profile
        const { data, error } = await supabase
          .from('student_profiles')
          .update({
            name: name.trim(),
            age_group: selectedAgeGroup,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingProfile.id)
          .select()
          .single();

        if (error) throw error;
        studentProfile = data;
      } else {
        // Create new profile
        const { data, error } = await supabase
          .from('student_profiles')
          .insert({
            user_id: profile.id,
            name: name.trim(),
            age_group: selectedAgeGroup
          })
          .select()
          .single();

        if (error) throw error;
        studentProfile = data;
      }

      // Update subjects
      if (editingProfile) {
        await supabase
          .from('student_subjects')
          .delete()
          .eq('student_profile_id', editingProfile.id);
      }

      const subjectInserts = selectedSubjects.map(subjectId => ({
        student_profile_id: studentProfile.id,
        subject_id: subjectId
      }));

      if (subjectInserts.length > 0) {
        const { error: subjectsError } = await supabase
          .from('student_subjects')
          .insert(subjectInserts);

        if (subjectsError) throw subjectsError;
      }

      // Update challenges
      if (editingProfile) {
        await supabase
          .from('student_challenges')
          .delete()
          .eq('student_profile_id', editingProfile.id);
      }

      const challengeInserts = selectedChallenges.map(challengeId => ({
        student_profile_id: studentProfile.id,
        challenge_id: challengeId
      }));

      if (challengeInserts.length > 0) {
        const { error: challengesError } = await supabase
          .from('student_challenges')
          .insert(challengeInserts);

        if (challengesError) throw challengesError;
      }

      toast({
        title: "Success!",
        description: `Profile ${editingProfile ? 'updated' : 'created'} successfully.`,
      });

      onSave(studentProfile);
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
            {editingProfile ? 'Edit My Profile' : 'Create My Profile'}
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
            <Label htmlFor="name">My Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              required
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="text-gray-600" size={20} />
              <h3 className="text-lg font-semibold text-gray-800">My Age Group</h3>
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
              <h3 className="text-lg font-semibold text-gray-800">Subjects I Want to Learn</h3>
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
              <h3 className="text-lg font-semibold text-gray-800">Areas Where I Need Extra Help</h3>
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
              {loading ? 'Saving...' : editingProfile ? 'Update Profile' : 'Create Profile'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentProfileForm;
