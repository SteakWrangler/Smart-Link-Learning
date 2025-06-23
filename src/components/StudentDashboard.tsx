
import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, BookOpen, Brain, MessageSquare, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Child, Subject, Challenge } from '@/types/database';
import ChatInterface from './ChatInterface';
import DocumentManager from './DocumentManager';

interface StudentDashboardProps {
  onBack: () => void;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ onBack }) => {
  const { profile } = useAuth();
  const [studentChild, setStudentChild] = useState<Child | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedChallenges, setSelectedChallenges] = useState<string[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchStudentData();
    }
  }, [profile]);

  const fetchStudentData = async () => {
    try {
      // For student dashboard, we look for a child record where parent_id = user_id
      // This represents the student's own profile
      const { data: childData } = await supabase
        .from('children')
        .select('*')
        .eq('parent_id', profile?.id)
        .single();

      if (childData) {
        setStudentChild(childData);
        
        // Fetch selected subjects
        const { data: subjectData } = await supabase
          .from('child_subjects')
          .select('subject_id, subjects(name)')
          .eq('child_id', childData.id);

        if (subjectData) {
          setSelectedSubjects(subjectData.map(s => s.subject_id));
        }

        // Fetch selected challenges
        const { data: challengeData } = await supabase
          .from('child_challenges')
          .select('challenge_id, challenges(name)')
          .eq('child_id', childData.id);

        if (challengeData) {
          setSelectedChallenges(challengeData.map(c => c.challenge_id));
        }
      }

      // Fetch all subjects and challenges
      const [subjectsResult, challengesResult] = await Promise.all([
        supabase.from('subjects').select('*'),
        supabase.from('challenges').select('*')
      ]);

      if (subjectsResult.data) setSubjects(subjectsResult.data);
      if (challengesResult.data) setChallenges(challengesResult.data);

    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSave = async (profileData: any) => {
    try {
      if (studentChild) {
        // Update existing child record
        const { error: updateError } = await supabase
          .from('children')
          .update({
            name: profileData.name,
            age_group: profileData.age_group,
            updated_at: new Date().toISOString()
          })
          .eq('id', studentChild.id);

        if (updateError) throw updateError;

        // Update subjects and challenges
        await updateChildSubjectsAndChallenges(studentChild.id, profileData.subjects, profileData.challenges);
      } else {
        // Create new child record for student
        const { data: newChild, error: insertError } = await supabase
          .from('children')
          .insert({
            name: profileData.name,
            age_group: profileData.age_group,
            parent_id: profile?.id
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // Add subjects and challenges
        await updateChildSubjectsAndChallenges(newChild.id, profileData.subjects, profileData.challenges);
        setStudentChild(newChild);
      }

      await fetchStudentData();
    } catch (error) {
      console.error('Error saving student profile:', error);
    }
  };

  const updateChildSubjectsAndChallenges = async (childId: string, subjects: string[], challenges: string[]) => {
    try {
      // Remove existing subjects and challenges
      await supabase.from('child_subjects').delete().eq('child_id', childId);
      await supabase.from('child_challenges').delete().eq('child_id', childId);

      // Get subject and challenge IDs (lookup by name)
      const { data: subjectsData } = await supabase
        .from('subjects')
        .select('id, name')
        .in('name', subjects);

      const { data: challengesData } = await supabase
        .from('challenges')
        .select('id, name')
        .in('name', challenges);

      // Add new subject associations
      if (subjectsData && subjectsData.length > 0) {
        const subjectInserts = subjectsData.map(subject => ({
          child_id: childId,
          subject_id: subject.id
        }));
        await supabase.from('child_subjects').insert(subjectInserts);
      }

      // Add new challenge associations
      if (challengesData && challengesData.length > 0) {
        const challengeInserts = challengesData.map(challenge => ({
          child_id: childId,
          challenge_id: challenge.id
        }));
        await supabase.from('child_challenges').insert(challengeInserts);
      }
    } catch (error) {
      console.error('Error updating child subjects and challenges:', error);
      throw error;
    }
  };

  const startLearningSession = () => {
    if (!studentChild) return;
    setShowChat(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (showChat && studentChild) {
    const selectedSubjectNames = subjects
      .filter(s => selectedSubjects.includes(s.id))
      .map(s => s.name)
      .join(', ');
    
    const selectedChallengeNames = challenges
      .filter(c => selectedChallenges.includes(c.id))
      .map(c => c.name)
      .join(', ');

    // Convert Child to the expected format for ChatInterface
    const childForChat = {
      id: studentChild.id,
      parent_id: studentChild.parent_id,
      name: studentChild.name,
      age_group: studentChild.age_group,
      subjects: subjects.filter(s => selectedSubjects.includes(s.id)).map(s => s.name),
      challenges: challenges.filter(c => selectedChallenges.includes(c.id)).map(c => c.name),
      created_at: studentChild.created_at,
      updated_at: studentChild.updated_at
    };

    return (
      <ChatInterface
        selectedCategories={{
          subject: selectedSubjectNames,
          ageGroup: studentChild.age_group,
          challenge: selectedChallengeNames
        }}
        onBack={() => setShowChat(false)}
        selectedChild={childForChat}
        onSaveConversation={() => {}}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft size={20} />
              Back
            </button>
            <h1 className="text-2xl font-bold text-gray-800">My Learning Dashboard</h1>
          </div>
          <Button
            onClick={() => setShowDocuments(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FileText size={16} />
            My Documents
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6">
        {!studentChild ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User size={24} />
                Set Up Your Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Let's set up your learning profile so we can provide you with personalized lessons!
              </p>
              <Button
                onClick={() => handleProfileSave({
                  name: 'My Profile',
                  age_group: 'elementary',
                  subjects: [],
                  challenges: []
                })}
                className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
              >
                Create My Profile
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Profile Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User size={24} />
                  {studentChild.name}'s Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Age Group</h4>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    {studentChild.age_group}
                  </span>
                </div>

                {selectedSubjects.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <BookOpen size={16} />
                      My Subjects
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {subjects
                        .filter(s => selectedSubjects.includes(s.id))
                        .map(subject => (
                          <span
                            key={subject.id}
                            className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                          >
                            {subject.name}
                          </span>
                        ))}
                    </div>
                  </div>
                )}

                {selectedChallenges.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Brain size={16} />
                      Learning Support Areas
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {challenges
                        .filter(c => selectedChallenges.includes(c.id))
                        .map(challenge => (
                          <span
                            key={challenge.id}
                            className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm"
                          >
                            {challenge.name}
                          </span>
                        ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <Button
                    onClick={startLearningSession}
                    className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 flex items-center gap-2"
                  >
                    <MessageSquare size={16} />
                    Start Learning Session
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Document Manager Modal */}
      {showDocuments && (
        <DocumentManager onClose={() => setShowDocuments(false)} />
      )}
    </div>
  );
};

export default StudentDashboard;
