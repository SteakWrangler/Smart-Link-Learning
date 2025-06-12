import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, BookOpen, Brain } from 'lucide-react';
import type { Student } from '@/types/database';
import AddStudentForm from './AddStudentForm';

interface StudentManagerProps {
  onStudentSelected: (student: Student) => void;
}

const StudentManager: React.FC<StudentManagerProps> = ({ onStudentSelected }) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchStudents();
    }
  }, [profile]);

  const fetchStudents = async () => {
    if (!profile) return;

    try {
      // Fetch students
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', profile.id);

      if (studentsError) throw studentsError;

      // Fetch subjects and challenges for each student
      const studentsWithDetails = await Promise.all(
        studentsData.map(async (student) => {
          // Fetch subjects
          const { data: subjectsData, error: subjectsError } = await supabase
            .from('student_subjects')
            .select('subject_id')
            .eq('student_id', student.id);

          if (subjectsError) throw subjectsError;

          // Fetch challenges
          const { data: challengesData, error: challengesError } = await supabase
            .from('student_challenges')
            .select('challenge_id')
            .eq('student_id', student.id);

          if (challengesError) throw challengesError;

          return {
            ...student,
            subjects: subjectsData.map(s => s.subject_id),
            challenges: challengesData.map(c => c.challenge_id)
          };
        })
      );

      setStudents(studentsWithDetails);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch students. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStudent = async (studentData: Omit<Student, 'id' | 'created_at'>) => {
    if (!profile) return;

    try {
      // Insert student
      const { data: student, error: studentError } = await supabase
        .from('students')
        .insert({
          user_id: profile.id,
          name: studentData.name,
          age_group: studentData.age_group
        })
        .select()
        .single();

      if (studentError) throw studentError;

      // Insert subjects
      if (studentData.subjects.length > 0) {
        const subjectInserts = studentData.subjects.map(subjectId => ({
          student_id: student.id,
          subject_id: subjectId
        }));

        const { error: subjectsError } = await supabase
          .from('student_subjects')
          .insert(subjectInserts);

        if (subjectsError) throw subjectsError;
      }

      // Insert challenges
      if (studentData.challenges.length > 0) {
        const challengeInserts = studentData.challenges.map(challengeId => ({
          student_id: student.id,
          challenge_id: challengeId
        }));

        const { error: challengesError } = await supabase
          .from('student_challenges')
          .insert(challengeInserts);

        if (challengesError) throw challengesError;
      }

      // Fetch the complete student data with subjects and challenges
      const { data: completeStudent, error: fetchError } = await supabase
        .from('students')
        .select(`
          *,
          student_subjects (subject_id),
          student_challenges (challenge_id)
        `)
        .eq('id', student.id)
        .single();

      if (fetchError) throw fetchError;

      const formattedStudent: Student = {
        ...completeStudent,
        subjects: completeStudent.student_subjects.map((s: any) => s.subject_id),
        challenges: completeStudent.student_challenges.map((c: any) => c.challenge_id)
      };

      setStudents(prev => [...prev, formattedStudent]);
      setShowAddForm(false);
      toast({
        title: 'Success',
        description: 'Student profile created successfully.'
      });
    } catch (error) {
      console.error('Error creating student:', error);
      toast({
        title: 'Error',
        description: 'Failed to create student profile. Please try again.',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Students</h1>
        <Button onClick={() => setShowAddForm(true)}>Add New Student</Button>
      </div>

      {showAddForm ? (
        <AddStudentForm
          onSave={handleSaveStudent}
          onCancel={() => setShowAddForm(false)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {students.map((student) => (
            <Card
              key={student.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => onStudentSelected(student)}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User size={24} />
                  {student.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Age Group</h4>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    {student.age_group}
                  </span>
                </div>

                {student.subjects.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <BookOpen size={16} />
                      Subjects
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {student.subjects.map((subjectId) => (
                        <span
                          key={subjectId}
                          className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                        >
                          {subjectId}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {student.challenges.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Brain size={16} />
                      Learning Challenges
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {student.challenges.map((challengeId) => (
                        <span
                          key={challengeId}
                          className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                        >
                          {challengeId}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentManager; 