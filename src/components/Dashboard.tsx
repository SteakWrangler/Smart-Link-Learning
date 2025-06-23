import React, { useState, useEffect } from 'react';
import { Plus, BookOpen, MessageSquare, History, User, Users, UserPlus } from 'lucide-react';
import { Child, SavedConversation } from '../types';
import { useAuth } from '@/hooks/useAuth';
import { useChildrenData } from '@/hooks/useChildrenData';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import ChildProfile from './ChildProfile';
import AddChildForm from './AddChildForm';
import ChatInterface from './ChatInterface';
import ConversationHistory from './ConversationHistory';
import StudentDashboard from './StudentDashboard';

const Dashboard: React.FC = () => {
  const { profile, loading: authLoading } = useAuth();
  const { children, loading: childrenLoading, refetch: refetchChildren } = useChildrenData();
  const [showAddChild, setShowAddChild] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<{
    subject: string;
    ageGroup: string;
    challenge: string;
  } | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showStudentView, setShowStudentView] = useState(false);
  const [savedConversations, setSavedConversations] = useState<SavedConversation[]>([]);
  const [deleteConfirmChild, setDeleteConfirmChild] = useState<string | null>(null);

  useEffect(() => {
    if (profile && !authLoading) {
      loadConversations();
    }
  }, [profile, authLoading]);

  const handleAddChild = async (childData: Omit<Child, 'id' | 'created_at' | 'updated_at'>) => {
    if (!profile) return;

    try {
      if (editingChild) {
        // Update existing child
        const { error: updateError } = await supabase
          .from('children')
          .update({
            name: childData.name,
            age_group: childData.age_group,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingChild.id);

        if (updateError) throw updateError;

        // Update subjects and challenges
        await updateChildSubjectsAndChallenges(
          editingChild.id, 
          childData.subjects as string[], 
          childData.challenges as string[]
        );

        toast({
          title: "Student profile updated successfully!",
          description: "Changes have been saved.",
        });
      } else {
        // Create new child
        const { data: newChild, error: insertError } = await supabase
          .from('children')
          .insert({
            name: childData.name,
            age_group: childData.age_group,
            parent_id: profile.id
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // Add subjects and challenges
        await updateChildSubjectsAndChallenges(
          newChild.id, 
          childData.subjects as string[], 
          childData.challenges as string[]
        );

        toast({
          title: "Student profile created successfully!",
          description: "You can now start learning sessions.",
        });
      }

      await refetchChildren();
      setShowAddChild(false);
      setEditingChild(null);
    } catch (error: any) {
      console.error('Error saving child:', error);
      toast({
        title: "Error saving student profile",
        description: error.message,
        variant: "destructive",
      });
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

  const loadConversations = async () => {
    if (!profile) return;

    try {
      console.log('Loading conversations for user:', profile.id);
      
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          child:child_id (
            id,
            name
          ),
          messages (
            id,
            content,
            type,
            created_at
          )
        `)
        .eq('parent_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      console.log('Loaded conversations data:', data);

      const formattedConversations = data.map(conv => ({
        id: conv.id,
        title: conv.title,
        child_id: conv.child_id,
        child_name: conv.child ? conv.child.name : 'Unknown',
        messages: conv.messages.map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          type: msg.type,
          created_at: msg.created_at
        })),
        created_at: conv.created_at,
        is_favorite: conv.is_favorite || false,
        is_saved: conv.is_saved || false
      }));

      setSavedConversations(formattedConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const handleDeleteChild = async (childId: string) => {
    if (!profile) return;

    try {
      console.log('Deleting child:', childId);
      
      // Delete the child (cascade will handle related records)
      const { error } = await supabase
        .from('children')
        .delete()
        .eq('id', childId)
        .eq('parent_id', profile.id);

      if (error) throw error;

      // Refresh children list
      await refetchChildren();
      setSavedConversations(prev => prev.filter(conv => conv.child_id !== deleteConfirmChild));
      
      toast({
        title: "Success",
        description: "Student profile deleted successfully.",
      });
    } catch (error: any) {
      console.error('Error deleting child:', error);
      toast({
        title: "Error",
        description: "Failed to delete student profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleteConfirmChild(null);
    }
  };

  const handleEditChild = (child: Child) => {
    setEditingChild(child);
    setShowAddChild(true);
  };

  const handleSelectChild = (child: Child) => {
    setSelectedChild(child);
    
    // Auto-select some default categories based on the child's profile
    setSelectedCategories({
      subject: child.subjects?.[0]?.name || 'General',
      ageGroup: child.age_group,
      challenge: child.challenges?.[0]?.name || 'General Support'
    });
  };

  const handleSaveConversation = async (conversation: any) => {
    try {
      console.log('Saving conversation:', conversation);
      await loadConversations();
      
      toast({
        title: "Conversation saved!",
        description: "You can find it in your conversation history.",
      });
    } catch (error) {
      console.error('Error in save conversation callback:', error);
    }
  };

  const handleLoadConversation = async (conversation: SavedConversation) => {
    try {
      // Find the child
      const child = children.find(child => child.id === conversation.child_id);
      if (!child) {
        throw new Error('Child not found');
      }

      // Load the conversation into the chat interface
      setSelectedChild(child);
      
      // Set the selected categories based on the conversation context
      setSelectedCategories({
        subject: 'Previous Conversation',
        ageGroup: child.age_group,
        challenge: child.challenges?.[0]?.name || 'General'
      });

      // Hide history to show chat
      setShowHistory(false);
      
      toast({
        title: "Conversation loaded!",
        description: "Continuing your previous conversation.",
      });
    } catch (error: any) {
      console.error('Error loading conversation:', error);
      toast({
        title: "Error",
        description: "Failed to load conversation. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (authLoading || childrenLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Please log in to continue</h2>
        </div>
      </div>
    );
  }

  // Show student dashboard if student view is selected
  if (showStudentView) {
    return <StudentDashboard onBack={() => setShowStudentView(false)} />;
  }

  // Show conversation history
  if (showHistory) {
    return (
      <ConversationHistory
        children={children}
        onLoadConversation={handleLoadConversation}
        onBack={() => setShowHistory(false)}
        profile={profile}
      />
    );
  }

  // Show chat interface
  if (selectedChild && selectedCategories) {
    return (
      <ChatInterface
        selectedCategories={selectedCategories}
        onBack={() => {
          setSelectedChild(null);
          setSelectedCategories(null);
        }}
        selectedChild={selectedChild}
        onSaveConversation={handleSaveConversation}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Learning Assistant Dashboard</h1>
            <p className="text-gray-600">Manage student profiles and learning sessions</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <History size={20} />
              Conversation History
            </button>
            <button
              onClick={() => setShowStudentView(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
            >
              <User size={20} />
              Student View
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button
            onClick={() => setShowAddChild(true)}
            className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 text-left border border-gray-200"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
                <UserPlus className="text-white" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Add Student</h3>
                <p className="text-gray-600 text-sm">Create a new student profile</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setShowHistory(true)}
            className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 text-left border border-gray-200"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <MessageSquare className="text-white" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">View Conversations</h3>
                <p className="text-gray-600 text-sm">Browse saved learning sessions</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setShowStudentView(true)}
            className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 text-left border border-gray-200"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <BookOpen className="text-white" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Student Dashboard</h3>
                <p className="text-gray-600 text-sm">Switch to student learning view</p>
              </div>
            </div>
          </button>
        </div>

        {/* Student Profiles */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Users size={24} />
              Student Profiles ({children.length})
            </h2>
            <button
              onClick={() => setShowAddChild(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-lg hover:from-blue-600 hover:to-green-600 transition-all"
            >
              <Plus size={20} />
              Add Student
            </button>
          </div>

          {children.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-200">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="text-gray-400" size={32} />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No Student Profiles Yet</h3>
              <p className="text-gray-600 mb-4">
                Create your first student profile to start personalized learning sessions.
              </p>
              <button
                onClick={() => setShowAddChild(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-lg hover:from-blue-600 hover:to-green-600 transition-all"
              >
                Create Student Profile
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {children.map(child => (
                <ChildProfile
                  key={child.id}
                  child={child}
                  onEdit={handleEditChild}
                  onDelete={(childId) => setDeleteConfirmChild(childId)}
                  onSelect={handleSelectChild}
                />
              ))}
            </div>
          )}
        </div>

        {/* Recent Conversations */}
        {savedConversations.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <MessageSquare size={24} />
                Recent Conversations
              </h2>
              <button
                onClick={() => setShowHistory(true)}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                View All
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedConversations.slice(0, 6).map(conversation => (
                <div
                  key={conversation.id}
                  onClick={() => handleLoadConversation(conversation)}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 cursor-pointer border border-gray-200"
                >
                  <h3 className="font-medium text-gray-800 mb-2">{conversation.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{conversation.child_name}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(conversation.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Child Modal */}
      {showAddChild && (
        <AddChildForm
          onSave={handleAddChild}
          onCancel={() => {
            setShowAddChild(false);
            setEditingChild(null);
          }}
          editingChild={editingChild}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmChild && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Confirm Deletion</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this student profile? This action cannot be undone and will also delete all associated conversations and data.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteConfirmChild(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteConfirmChild && handleDeleteChild(deleteConfirmChild)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
