import React, { useState, useEffect } from 'react';
import { Plus, MessageSquare, Star, LifeBuoy, ArrowLeft, FileText } from 'lucide-react';
import { Child, SavedConversation } from '../types';
import { Child as DatabaseChild } from '../types/database';
import ChildProfile from './ChildProfile';
import AddChildForm from './AddChildForm';
import ConversationHistory from './ConversationHistory';
import ChatInterface from './ChatInterface';
import DocumentManager from './DocumentManager';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface DashboardProps {
  onBack: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onBack }) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [children, setChildren] = useState<Child[]>([]);
  const [savedConversations, setSavedConversations] = useState<SavedConversation[]>([]);
  const [showAddChild, setShowAddChild] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | undefined>();
  const [selectedChild, setSelectedChild] = useState<Child | undefined>();
  const [activeTab, setActiveTab] = useState<'children' | 'conversations' | 'documents' | 'support'>('children');
  const [showChat, setShowChat] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchChildren();
    }
  }, [profile]);

  const fetchChildren = async () => {
    if (!profile) return;

    try {
      setLoading(true);
      
      // Fetch children from database
      const { data: childrenData, error: childrenError } = await supabase
        .from('children')
        .select(`
          *,
          child_subjects!inner(
            subjects(name)
          ),
          child_challenges!inner(
            challenges(name)
          )
        `)
        .eq('parent_id', profile.id);

      if (childrenError) throw childrenError;

      // Transform database children to frontend format
      const transformedChildren: Child[] = (childrenData || []).map((dbChild: any) => ({
        id: dbChild.id,
        name: dbChild.name,
        ageGroup: dbChild.age_group,
        subjects: dbChild.child_subjects?.map((cs: any) => cs.subjects.name) || [],
        challenges: dbChild.child_challenges?.map((cc: any) => cc.challenges.name) || [],
        createdAt: new Date(dbChild.created_at)
      }));

      setChildren(transformedChildren);
    } catch (error) {
      console.error('Error fetching children:', error);
      toast({
        title: "Error",
        description: "Failed to load children",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddChild = async (childData: Omit<Child, 'id' | 'createdAt'>) => {
    if (!profile) return;

    try {
      if (editingChild) {
        // Update existing child
        const { error: updateError } = await supabase
          .from('children')
          .update({
            name: childData.name,
            age_group: childData.ageGroup,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingChild.id);

        if (updateError) throw updateError;

        // Update subjects and challenges
        await updateChildSubjectsAndChallenges(editingChild.id, childData.subjects, childData.challenges);
        
        toast({
          title: "Success",
          description: "Child updated successfully",
        });
      } else {
        // Create new child
        const { data: newChild, error: insertError } = await supabase
          .from('children')
          .insert({
            name: childData.name,
            age_group: childData.ageGroup,
            parent_id: profile.id
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // Add subjects and challenges
        await updateChildSubjectsAndChallenges(newChild.id, childData.subjects, childData.challenges);

        toast({
          title: "Success",
          description: "Child added successfully",
        });
      }

      // Refresh children list
      await fetchChildren();
      setEditingChild(undefined);
      setShowAddChild(false);
    } catch (error) {
      console.error('Error saving child:', error);
      toast({
        title: "Error",
        description: "Failed to save child",
        variant: "destructive",
      });
    }
  };

  const updateChildSubjectsAndChallenges = async (childId: string, subjects: string[], challenges: string[]) => {
    // Remove existing subjects and challenges
    await supabase.from('child_subjects').delete().eq('child_id', childId);
    await supabase.from('child_challenges').delete().eq('child_id', childId);

    // Get subject and challenge IDs
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
  };

  const handleEditChild = (child: Child) => {
    setEditingChild(child);
    setShowAddChild(true);
  };

  const handleDeleteChild = async (childId: string) => {
    if (!confirm('Are you sure you want to delete this child profile?')) return;

    try {
      // Delete child associations first
      await supabase.from('child_subjects').delete().eq('child_id', childId);
      await supabase.from('child_challenges').delete().eq('child_id', childId);
      
      // Delete child
      const { error } = await supabase
        .from('children')
        .delete()
        .eq('id', childId);

      if (error) throw error;

      // Refresh children list
      await fetchChildren();
      setSavedConversations(prev => prev.filter(conv => conv.childId !== childId));
      
      toast({
        title: "Success",
        description: "Child deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting child:', error);
      toast({
        title: "Error",
        description: "Failed to delete child",
        variant: "destructive",
      });
    }
  };

  const handleSelectChild = (child: Child) => {
    setSelectedChild(child);
    setShowChat(true);
  };

  const handleSaveConversation = (conversation: Omit<SavedConversation, 'id' | 'createdAt'>) => {
    const newConversation: SavedConversation = {
      ...conversation,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    setSavedConversations(prev => [...prev, newConversation]);
  };

  if (showChat && selectedChild) {
    return (
      <ChatInterface
        selectedCategories={{
          subject: selectedChild.subjects.join(', '),
          ageGroup: selectedChild.ageGroup,
          challenge: selectedChild.challenges.join(', ')
        }}
        onBack={() => setShowChat(false)}
        selectedChild={selectedChild}
        onSaveConversation={handleSaveConversation}
      />
    );
  }

  if (showDocuments) {
    return (
      <DocumentManager onClose={() => setShowDocuments(false)} />
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
              Children
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
              <h2 className="text-xl font-semibold text-gray-800">Your Children</h2>
              <button
                onClick={() => setShowAddChild(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
              >
                <Plus size={20} />
                Add Child
              </button>
            </div>

            {children.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">No children added yet</h3>
                <p className="text-gray-600 mb-4">
                  Add your first child to start creating personalized lesson plans
                </p>
                <button
                  onClick={() => setShowAddChild(true)}
                  className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200"
                >
                  Add Your First Child
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {children.map(child => (
                  <ChildProfile
                    key={child.id}
                    child={child}
                    onEdit={handleEditChild}
                    onDelete={handleDeleteChild}
                    onSelect={handleSelectChild}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'conversations' && (
          <ConversationHistory
            conversations={savedConversations}
            children={children}
            onLoadConversation={(conversation) => {
              const child = children.find(c => c.id === conversation.childId);
              if (child) {
                setSelectedChild(child);
                setShowChat(true);
              }
            }}
          />
        )}

        {activeTab === 'documents' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">Document Manager</h2>
              <button
                onClick={() => setShowDocuments(true)}
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
                  onClick={() => setShowDocuments(true)}
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
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-800 mb-3">Getting Started Guide</h3>
                <p className="text-blue-700 mb-4">
                  Learn how to create effective lesson plans and work with your child's learning style.
                </p>
                <button className="text-blue-600 font-medium hover:text-blue-800 transition-colors">
                  Read Guide →
                </button>
              </div>
              
              <div className="bg-green-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-800 mb-3">Managing Frustration</h3>
                <p className="text-green-700 mb-4">
                  Tips and strategies for handling learning challenges and keeping sessions positive.
                </p>
                <button className="text-green-600 font-medium hover:text-green-800 transition-colors">
                  Learn More →
                </button>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-purple-800 mb-3">ADHD Support</h3>
                <p className="text-purple-700 mb-4">
                  Specialized techniques for high-energy children and focus challenges.
                </p>
                <button className="text-purple-600 font-medium hover:text-purple-800 transition-colors">
                  View Resources →
                </button>
              </div>
              
              <div className="bg-orange-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-orange-800 mb-3">Community Forum</h3>
                <p className="text-orange-700 mb-4">
                  Connect with other parents and share experiences and advice.
                </p>
                <button className="text-orange-600 font-medium hover:text-orange-800 transition-colors">
                  Join Discussion →
                </button>
              </div>
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
            setEditingChild(undefined);
          }}
          editingChild={editingChild}
        />
      )}
    </div>
  );
};

export default Dashboard;
