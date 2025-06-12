import React, { useState, useEffect } from 'react';
import { Plus, MessageSquare, Star, LifeBuoy, ArrowLeft, FileText, X } from 'lucide-react';
import { Child, SavedConversation } from '../types';
import { Child as DatabaseChild } from '../types/database';
import ChildProfile from './ChildProfile';
import AddChildForm from './AddChildForm';
import ConversationHistory from './ConversationHistory';
import ChatInterface from './ChatInterface';
import DocumentManager from './DocumentManager';
import CommunityForum from './CommunityForum';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Student, Subject, Challenge } from '../types/database';
import { AddStudentForm } from './AddStudentForm';
import { StudentProfile } from './StudentProfile';

interface DashboardProps {
  onBack: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onBack }) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [savedConversations, setSavedConversations] = useState<SavedConversation[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [activeTab, setActiveTab] = useState<'children' | 'conversations' | 'documents' | 'support'>('children');
  const [showConversationHistory, setShowConversationHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmStudent, setDeleteConfirmStudent] = useState<Student | null>(null);
  const [showResourceModal, setShowResourceModal] = useState<string | null>(null);
  const [showCommunityForum, setShowCommunityForum] = useState(false);
  const [forumInitialCategory, setForumInitialCategory] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (profile) {
      fetchStudents();
      fetchSubjects();
      fetchChallenges();
    }
  }, [profile]);

  const fetchStudents = async () => {
    if (!profile) return;

    try {
      setLoading(true);
      console.log('Fetching students for profile:', profile.id);
      
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (studentsError) {
        console.error('Error fetching students:', studentsError);
        throw studentsError;
      }

      console.log('Raw students data from database:', studentsData);

      // Fetch subjects and challenges for each student
      const studentsWithDetails = await Promise.all(
        (studentsData || []).map(async (student) => {
          // Fetch subjects
          const { data: subjectsData, error: subjectsError } = await supabase
            .from('student_subjects')
            .select('subjects(name)')
            .eq('student_id', student.id);

          if (subjectsError) {
            console.error('Error fetching subjects:', subjectsError);
            return student;
          }

          // Fetch challenges
          const { data: challengesData, error: challengesError } = await supabase
            .from('student_challenges')
            .select('challenges(name)')
            .eq('student_id', student.id);

          if (challengesError) {
            console.error('Error fetching challenges:', challengesError);
            return student;
          }

          return {
            ...student,
            subjects: subjectsData?.map(s => s.subjects.name) || [],
            challenges: challengesData?.map(c => c.challenges.name) || []
          };
        })
      );

      setStudents(studentsWithDetails);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: "Error",
        description: "Failed to load students",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching subjects:', error);
      return;
    }

    setSubjects(data || []);
  };

  const fetchChallenges = async () => {
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching challenges:', error);
      return;
    }

    setChallenges(data || []);
  };

  const handleAddStudent = async (studentData: Partial<Student>) => {
    if (!profile) return;

    try {
      console.log('Adding/updating student:', studentData);

      if (editingStudent) {
        // Update existing student
        const { data: updatedStudent, error: updateError } = await supabase
          .from('students')
          .update(studentData)
          .eq('id', editingStudent.id)
          .select()
          .single();

        if (updateError) throw updateError;

        setStudents(students.map(s => (s.id === updatedStudent.id ? updatedStudent : s)));
        
        toast({
          title: "Success",
          description: "Student updated successfully",
        });
      } else {
        // Create new student
        const { data: newStudent, error: insertError } = await supabase
          .from('students')
          .insert([
            {
              ...studentData,
              user_id: profile.id,
            },
          ])
          .select()
          .single();

        if (insertError) throw insertError;
        console.log('Created new student:', newStudent);

        setStudents([newStudent, ...students]);

        toast({
          title: "Success",
          description: "Student added successfully",
        });
      }

      // Refresh students list
      await fetchStudents();
      setEditingStudent(null);
      setShowAddForm(false);
    } catch (error) {
      console.error('Error saving student:', error);
      toast({
        title: "Error",
        description: "Failed to save student",
        variant: "destructive",
      });
    }
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setShowAddForm(true);
  };

  const handleDeleteStudent = async (student: Student) => {
    console.log('Delete clicked for student:', student.id);
    setDeleteConfirmStudent(student);
  };

  const confirmDeleteStudent = async () => {
    if (!deleteConfirmStudent) return;

    try {
      console.log('Starting delete process for student:', deleteConfirmStudent.id);
      
      // Delete student
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', deleteConfirmStudent.id);

      if (error) {
        console.error('Error deleting student:', error);
        throw error;
      }

      console.log('Student deleted successfully');

      // Refresh students list
      await fetchStudents();
      setSavedConversations(prev => prev.filter(conv => conv.childId !== deleteConfirmStudent.id));
      
      toast({
        title: "Success",
        description: "Student deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting student:', error);
      toast({
        title: "Error",
        description: "Failed to delete student",
        variant: "destructive",
      });
    } finally {
      setDeleteConfirmStudent(null);
    }
  };

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setShowConversationHistory(false);
  };

  const handleSaveConversation = (conversation: Omit<SavedConversation, 'id' | 'createdAt'>) => {
    const newConversation: SavedConversation = {
      ...conversation,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    setSavedConversations(prev => [...prev, newConversation]);
  };

  // Handle support action clicks
  const handleSupportAction = (topic: string, actionType: 'resources' | 'community') => {
    switch (actionType) {
      case 'resources':
        // Show resource modal with multiple options
        setShowResourceModal(topic);
        break;
      case 'community':
        // Open community forum
        setForumInitialCategory(topic);
        setShowCommunityForum(true);
        break;
    }
  };

  // Get unique challenges from all students
  const getStudentsChallenges = (): string[] => {
    const allChallenges = students.flatMap(student => student.challenges || []);
    return [...new Set(allChallenges)]; // Remove duplicates
  };

  // Comprehensive resource database with multiple sources for each topic
  const getResourcesForTopic = (topic: string) => {
    const resourceDatabase: Record<string, {
      title: string;
      resources: Array<{
        title: string;
        description: string;
        url: string;
        organization: string;
      }>;
    }> = {
      'guide': {
        title: 'Getting Started with Learning Support',
        resources: [
          {
            title: 'Getting Started with Learning and Thinking Differences',
            description: 'Step-by-step guide for parents beginning their learning support journey',
            url: 'https://www.understood.org/articles/getting-started-with-learning-and-thinking-differences',
            organization: 'Understood.org'
          },
          {
            title: 'Learning Disabilities: What You Need to Know',
            description: 'Comprehensive overview for families new to learning differences',
            url: 'https://www.verywellmind.com/learning-disabilities-what-parents-need-to-know-20586',
            organization: 'Verywell Mind'
          },
          {
            title: 'National Center for Learning Disabilities',
            description: 'Research, resources, and advocacy for learning disabilities',
            url: 'https://www.ncld.org/research-and-policy/what-is-ld/',
            organization: 'NCLD'
          },
          {
            title: 'CDC: Facts About Learning Disabilities',
            description: 'Medical and educational information about learning disabilities',
            url: 'https://www.cdc.gov/ncbddd/developmentaldisabilities/facts-about-intellectual-disability.html',
            organization: 'CDC'
          }
        ]
      },
      'frustration': {
        title: 'Managing Learning Frustration',
        resources: [
          {
            title: '70+ Mental Health Coping Skills for Kids',
            description: 'Practical tools to help your student stay strong in any situation',
            url: 'https://www.verywellmind.com/mental-health-coping-skills-for-kids-8724073',
            organization: 'Verywell Mind'
          },
          {
            title: 'How to Help a Student With Anxiety',
            description: 'Supporting students through learning-related stress and worry',
            url: 'https://www.understood.org/articles/anxiety-in-students-with-learning-differences',
            organization: 'Understood.org'
          },
          {
            title: 'Building Resilience in Students',
            description: 'Helping kids bounce back from learning challenges',
            url: 'https://childmind.org/guide/building-resilience-in-students/',
            organization: 'Child Mind Institute'
          },
          {
            title: 'Teaching Coping Skills to Students',
            description: 'Evidence-based strategies for emotional regulation',
            url: 'https://www.internet4classrooms.com/blog/2022/04/teaching_coping_skills_to_students.htm',
            organization: 'Internet4Classrooms'
          }
        ]
      },
      'adhd/focus issues': {
        title: 'ADHD & Focus Support',
        resources: [
          {
            title: 'CHADD Parent Resources',
            description: 'Evidence-based information and support for ADHD families',
            url: 'https://chadd.org/about-adhd/parents-caregivers/',
            organization: 'CHADD'
          },
          {
            title: '8 Simple Strategies for Students With ADHD',
            description: 'Helpful techniques for teachers and parents',
            url: 'https://www.verywellmind.com/help-for-students-with-adhd-20538',
            organization: 'Verywell Mind'
          },
          {
            title: 'CDC ADHD Information for Parents',
            description: 'Medical information and behavior management strategies',
            url: 'https://www.cdc.gov/ncbddd/adhd/facts.html',
            organization: 'CDC'
          },
          {
            title: 'ADHD and School Success',
            description: 'Academic support strategies and accommodations',
            url: 'https://www.understood.org/articles/adhd-and-school-what-you-need-to-know',
            organization: 'Understood.org'
          }
        ]
      },
      'dyslexia': {
        title: 'Dyslexia Support',
        resources: [
          {
            title: 'International Dyslexia Association',
            description: 'Comprehensive information about dyslexia and reading difficulties',
            url: 'https://dyslexiaida.org/dyslexia-basics/',
            organization: 'IDA'
          },
          {
            title: 'What Is Dyslexia?',
            description: 'Signs, causes, and how to help students with dyslexia',
            url: 'https://www.understood.org/articles/what-is-dyslexia',
            organization: 'Understood.org'
          },
          {
            title: 'Dyslexia Reading Programs That Work',
            description: 'Evidence-based interventions and teaching methods',
            url: 'https://www.verywellmind.com/teaching-reading-to-students-with-dyslexia-20530',
            organization: 'Verywell Mind'
          },
          {
            title: 'Dyslexia and Your Student',
            description: 'What parents need to know about supporting reading development',
            url: 'https://childmind.org/guide/dyslexia-and-your-student/',
            organization: 'Child Mind Institute'
          }
        ]
      },
      'processing delays': {
        title: 'Processing Delays Support',
        resources: [
          {
            title: 'Understanding Processing Issues',
            description: 'What processing issues are and how to help',
            url: 'https://www.understood.org/articles/processing-issues-in-kids-what-you-need-to-know',
            organization: 'Understood.org'
          },
          {
            title: 'Slow Processing Speed: What You Need to Know',
            description: 'Signs, causes, and ways to help students with slow processing speed',
            url: 'https://www.verywellmind.com/what-is-slow-processing-speed-20546',
            organization: 'Verywell Mind'
          },
          {
            title: 'Processing Speed and Executive Functioning',
            description: 'How processing speed impacts learning and daily activities',
            url: 'https://childmind.org/article/processing-speed-and-executive-functioning/',
            organization: 'Child Mind Institute'
          },
          {
            title: 'Sensory Processing Issues',
            description: 'Understanding and supporting sensory processing differences',
            url: 'https://www.understood.org/articles/sensory-processing-issues-what-you-need-to-know',
            organization: 'Understood.org'
          }
        ]
      },
      'math anxiety': {
        title: 'Math Anxiety Support',
        resources: [
          {
            title: 'How to Help Your Student Overcome Math Anxiety',
            description: 'Practical strategies to reduce math stress and build confidence',
            url: 'https://www.verywellmind.com/math-anxiety-in-students-20558',
            organization: 'Verywell Mind'
          },
          {
            title: 'Math Anxiety: What You Need to Know',
            description: 'Understanding causes and solutions for math fear',
            url: 'https://www.understood.org/articles/math-anxiety-what-you-need-to-know',
            organization: 'Understood.org'
          },
          {
            title: 'Math Anxiety and Dyscalculia',
            description: 'When math difficulties go beyond anxiety',
            url: 'https://childmind.org/article/how-to-help-kids-with-math-anxiety/',
            organization: 'Child Mind Institute'
          },
          {
            title: 'Khan Academy for Parents',
            description: 'Free resources to support math learning at home',
            url: 'https://www.khanacademy.org/about/blog/tag/parents',
            organization: 'Khan Academy'
          }
        ]
      },
      'general learning support': {
        title: 'General Learning Support',
        resources: [
          {
            title: 'Learning and Thinking Differences',
            description: 'Comprehensive guide to various learning differences',
            url: 'https://www.understood.org/articles/learning-and-thinking-differences-your-student-may-have',
            organization: 'Understood.org'
          },
          {
            title: 'Special Education Rights and Resources',
            description: 'Understanding IEPs, 504 plans, and special education law',
            url: 'https://www.parentcenterhub.org/find-your-center/',
            organization: 'Parent Information Centers'
          },
          {
            title: 'Learning Disabilities Association',
            description: 'National organization supporting individuals with learning disabilities',
            url: 'https://ldaamerica.org/support/new-to-ld/',
            organization: 'LDA'
          },
          {
            title: 'How to Support a Student With Learning Differences',
            description: 'Evidence-based strategies for parents and caregivers',
            url: 'https://www.verywellmind.com/supporting-students-with-learning-differences-20590',
            organization: 'Verywell Mind'
          }
        ]
      }
    };

    return resourceDatabase[topic] || null;
  };

  // Render challenge-specific support sections
  const renderChallengeSupport = () => {
    const challenges = getStudentsChallenges();
    const supportConfigs: Record<string, { 
      bgClass: string;
      titleClass: string;
      textClass: string;
      buttonClass: string;
      buttonHoverClass: string;
      description: string;
    }> = {
      'ADHD/Focus Issues': {
        bgClass: 'bg-purple-50',
        titleClass: 'text-purple-800',
        textClass: 'text-purple-700',
        buttonClass: 'text-purple-600',
        buttonHoverClass: 'hover:text-purple-800',
        description: 'Specialized techniques for high-energy students and focus challenges.'
      },
      'Dyslexia': {
        bgClass: 'bg-rose-50',
        titleClass: 'text-rose-800',
        textClass: 'text-rose-700',
        buttonClass: 'text-rose-600',
        buttonHoverClass: 'hover:text-rose-800',
        description: 'Reading support strategies and tools for dyslexic learners.'
      },
      'Processing Delays': {
        bgClass: 'bg-cyan-50',
        titleClass: 'text-cyan-800',
        textClass: 'text-cyan-700',
        buttonClass: 'text-cyan-600',
        buttonHoverClass: 'hover:text-cyan-800',
        description: 'Techniques for students with information processing challenges.'
      },
      'Math Anxiety': {
        bgClass: 'bg-amber-50',
        titleClass: 'text-amber-800',
        textClass: 'text-amber-700',
        buttonClass: 'text-amber-600',
        buttonHoverClass: 'hover:text-amber-800',
        description: 'Strategies to reduce math stress and build confidence.'
      },
      'General Learning Support': {
        bgClass: 'bg-green-50',
        titleClass: 'text-green-800',
        textClass: 'text-green-700',
        buttonClass: 'text-green-600',
        buttonHoverClass: 'hover:text-green-800',
        description: 'Universal learning strategies and motivational support.'
      }
    };

    return challenges.map(challenge => {
      const config = supportConfigs[challenge];
      if (!config) return null;

      const { bgClass, titleClass, textClass, buttonClass, buttonHoverClass, description } = config;
      
      return (
        <div key={challenge} className={`${bgClass} rounded-lg p-6`}>
          <h3 className={`text-lg font-semibold ${titleClass} mb-3`}>
            {challenge.includes('Support') ? challenge : `${challenge} Support`}
          </h3>
          <p className={`${textClass} mb-4`}>
            {description}
          </p>
          <div className="space-y-2">
            <button 
              onClick={() => handleSupportAction(challenge.toLowerCase(), 'resources')}
              className={`block ${buttonClass} font-medium ${buttonHoverClass} transition-colors`}
            >
              📚 Resources →
            </button>
            <button 
              onClick={() => handleSupportAction(challenge.toLowerCase(), 'community')}
              className={`block ${buttonClass} font-medium ${buttonHoverClass} transition-colors`}
            >
              👥 Discussion →
            </button>
          </div>
        </div>
      );
    }).filter(Boolean);
  };

  if (showConversationHistory && selectedStudent) {
    return (
      <ConversationHistory
        students={students}
        selectedStudent={selectedStudent}
        onSelectStudent={handleSelectStudent}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
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
              Back to Welcome
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Learning Dashboard</h1>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('children')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'children'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              Students
            </button>
            <button
              onClick={() => setActiveTab('conversations')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'conversations'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <MessageSquare size={16} className="inline mr-2" />
              History
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'documents'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <FileText size={16} className="inline mr-2" />
              Documents
            </button>
            <button
              onClick={() => setActiveTab('support')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'support'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <LifeBuoy size={16} className="inline mr-2" />
              Parent Support
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-6">
        {activeTab === 'children' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Your Students</h2>
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
              >
                <Plus size={20} />
                Add Student
              </button>
            </div>

            {students.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">No students added yet</h3>
                <p className="text-gray-600 mb-4">
                  Add your first student to start creating personalized lesson plans
                </p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200"
                >
                  Add Your First Student
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {students.map(student => (
                  <StudentProfile
                    key={student.id}
                    student={student}
                    onEdit={() => setEditingStudent(student)}
                    onDelete={() => setDeleteConfirmStudent(student)}
                    onSelect={() => handleSelectStudent(student)}
                    isSelected={selectedStudent?.id === student.id}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'conversations' && (
          <ConversationHistory
            conversations={savedConversations}
            students={students}
            onLoadConversation={(conversation) => {
              const student = students.find(s => s.id === conversation.childId);
              if (student) {
                setSelectedStudent(student);
                setShowConversationHistory(true);
              }
            }}
          />
        )}

        {activeTab === 'documents' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">Document Manager</h2>
              <button
                onClick={() => setShowConversationHistory(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
              >
                <FileText size={20} />
                Manage Documents
              </button>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">Upload and Manage Documents</h3>
                <p className="text-gray-600 mb-4">
                  Upload documents like failed tests, study guides, and homework to help create personalized learning plans.
                </p>
                <button
                  onClick={() => setShowConversationHistory(true)}
                  className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200"
                >
                  Open Document Manager
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'support' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Parent Support Resources</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* General Support */}
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-800 mb-3">Getting Started Guide</h3>
                <p className="text-blue-700 mb-4">
                  Learn how to create effective lesson plans and work with your student's learning style.
                </p>
                <div className="space-y-2">
                  <button 
                    onClick={() => handleSupportAction('guide', 'resources')}
                    className="block text-blue-600 font-medium hover:text-blue-800 transition-colors"
                  >
                    📚 View Online Resources →
                  </button>
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-800 mb-3">Managing Frustration</h3>
                <p className="text-green-700 mb-4">
                  Tips and strategies for handling learning challenges and keeping sessions positive.
                </p>
                <div className="space-y-2">
                  <button 
                    onClick={() => handleSupportAction('frustration', 'resources')}
                    className="block text-green-600 font-medium hover:text-green-800 transition-colors"
                  >
                    📚 View Resources →
                  </button>
                  <button 
                    onClick={() => handleSupportAction('frustration', 'community')}
                    className="block text-green-600 font-medium hover:text-green-800 transition-colors"
                  >
                    👥 Join Discussion →
                  </button>
                </div>
              </div>

              {/* Dynamic Challenge-Specific Support */}
              {renderChallengeSupport()}
              
              <div className="bg-orange-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-orange-800 mb-3">Community Forum</h3>
                <p className="text-orange-700 mb-4">
                  Connect with other parents and share experiences and advice.
                </p>
                <button 
                  onClick={() => handleSupportAction('community', 'community')}
                  className="text-orange-600 font-medium hover:text-orange-800 transition-colors"
                >
                  👥 Join Discussion →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Student Modal */}
      {showAddForm && (
        <AddStudentForm
          subjects={subjects}
          challenges={challenges}
          onSubmit={handleAddStudent}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Delete Student Profile
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this student profile? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmStudent(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteStudent}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resource Modal */}
      {showResourceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {(() => {
              const resources = getResourcesForTopic(showResourceModal);
              if (!resources) return null;

              return (
                <div>
                  <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800">
                      {resources.title}
                    </h2>
                    <button
                      onClick={() => setShowResourceModal(null)}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="p-6">
                    <p className="text-gray-600 mb-6">
                      Here are multiple trusted resources to help you. If one link isn't working, try the others:
                    </p>
                    
                    <div className="space-y-4">
                      {resources.resources.map((resource, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-800 mb-2">
                                {resource.title}
                              </h3>
                              <p className="text-gray-600 text-sm mb-2">
                                {resource.description}
                              </p>
                              <p className="text-gray-500 text-xs">
                                Source: {resource.organization}
                              </p>
                            </div>
                            <button
                              onClick={() => window.open(resource.url, '_blank')}
                              className="ml-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                            >
                              Visit Site
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-2">💡 Tips for Using These Resources:</h4>
                      <ul className="text-blue-700 text-sm space-y-1">
                        <li>• Try multiple resources to get different perspectives</li>
                        <li>• Bookmark the ones that are most helpful for your situation</li>
                        <li>• Many organizations offer free email newsletters with ongoing tips</li>
                        <li>• Look for local chapters or support groups mentioned on these sites</li>
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Community Forum Modal */}
      {showCommunityForum && (
        <CommunityForum
          onClose={() => {
            setShowCommunityForum(false);
            setForumInitialCategory(undefined);
          }}
          initialCategory={forumInitialCategory}
        />
      )}

      {selectedStudent && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Chat with {selectedStudent.name}</h2>
            <button
              onClick={() => setShowConversationHistory(!showConversationHistory)}
              className="text-blue-500 hover:text-blue-600"
            >
              {showConversationHistory ? 'Hide History' : 'Show History'}
            </button>
          </div>

          {showConversationHistory ? (
            <ConversationHistory
              students={students}
              selectedStudent={selectedStudent}
              onSelectStudent={handleSelectStudent}
            />
          ) : (
            <ChatInterface
              selectedCategories={{
                subject: selectedStudent.subjects?.join(', ') || '',
                ageGroup: selectedStudent.age_group || '',
                challenge: selectedStudent.challenges?.join(', ') || ''
              }}
              onBack={() => setSelectedStudent(null)}
              selectedStudent={selectedStudent}
              selectedStudentProfile={null}
              onSaveConversation={(conversation) => {
                // TODO: Implement conversation saving
                console.log('Saving conversation:', conversation);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
