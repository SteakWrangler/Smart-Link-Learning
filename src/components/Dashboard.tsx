import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Child, SavedConversation } from '../types';
import { supabase } from '@/integrations/supabase/client';
import AddChildForm from './AddChildForm';
import ChildProfile from './ChildProfile';
import ConversationHistory from './ConversationHistory';
import DocumentManager from './DocumentManager';
import { useAuth } from '@/hooks/useAuth';

const Dashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [showAddChild, setShowAddChild] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [conversations, setConversations] = useState<SavedConversation[]>([]);
  const [activeTab, setActiveTab] = useState<'profiles' | 'conversations' | 'documents'>('profiles');
  const [showDocumentManager, setShowDocumentManager] = useState(false);

  useEffect(() => {
    if (user) {
      loadChildren();
    }
  }, [user]);

  const loadChildren = async () => {
    if (!user) return;

    try {
      console.log('Loading children for user:', user.id);
      
      const { data, error } = await supabase
        .from('children')
        .select(`
          *,
          child_subjects (
            subjects (name)
          ),
          child_challenges (
            challenges (name)
          )
        `)
        .eq('parent_id', user.id);

      if (error) {
        console.error('Error loading children:', error);
        throw error;
      }

      console.log('Raw children data from database:', data);

      setChildren(data?.map(child => ({
        id: child.id,
        name: child.name,
        ageGroup: child.age_group,
        subjects: child.child_subjects.map((cs: any) => cs.subjects.name),
        challenges: child.child_challenges.map((cc: any) => cc.challenges.name),
        createdAt: new Date(child.created_at),
        parent_id: child.parent_id
      })) || []);
    } catch (error) {
      console.error('Error loading children:', error);
    }
  };

  const handleAddChild = async (childData: Omit<Child, 'id' | 'createdAt'>) => {
    console.log('Dashboard handleAddChild called with:', childData);
    
    if (!user) {
      console.error('No user found for adding child');
      return;
    }

    try {
      console.log('Inserting child into database...');
      
      // Insert child record
      const { data: child, error: childError } = await supabase
        .from('children')
        .insert({
          name: childData.name,
          age_group: childData.ageGroup,
          parent_id: user.id
        })
        .select()
        .single();

      if (childError) {
        console.error('Error inserting child:', childError);
        throw childError;
      }

      console.log('Child inserted successfully:', child);

      // TODO: Handle subjects and challenges insertion into junction tables
      // For now, just reload the children list
      
      setShowAddChild(false);
      setEditingChild(null);
      await loadChildren();
      
      console.log('Child addition completed successfully');
    } catch (error) {
      console.error('Error adding child:', error);
    }
  };

  const handleEditChild = (child: Child) => {
    setEditingChild(child);
    setShowAddChild(true);
  };

  const handleDeleteChild = async (childId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('children')
        .delete()
        .eq('id', childId)
        .eq('parent_id', user.id);

      setChildren(children.filter(child => child.id !== childId));
    } catch (error) {
      console.error('Error deleting child:', error);
    }
  };

  const handleSelectChild = (child: Child) => {
    setSelectedChild(child);
    loadConversations(child.id);
  };

  const loadConversations = async (childId: string) => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('child_id', childId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading conversations:', error);
        return;
      }

      setConversations(data?.map(conversation => ({
        id: conversation.id,
        title: conversation.title,
        childId: conversation.child_id || '',
        childName: selectedChild?.name || '',
        messages: [], // Load messages separately if needed
        createdAt: new Date(conversation.created_at),
        isFavorite: conversation.is_favorite || false,
      })) || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const handleLoadConversation = (conversation: SavedConversation) => {
    // TODO: Implement conversation loading logic
    console.log('Loading conversation:', conversation);
  };

  const handleBackToProfiles = () => {
    setActiveTab('profiles');
  };

  const Header = () => (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
      </div>
    </header>
  );

  const TabButton = ({
    tab,
    label,
    setActiveTab,
    activeTab: currentTab,
  }: {
    tab: 'profiles' | 'conversations' | 'documents';
    label: string;
    setActiveTab: (tab: 'profiles' | 'conversations' | 'documents') => void;
    activeTab: 'profiles' | 'conversations' | 'documents';
  }) => (
    <button
      onClick={() => {
        setActiveTab(tab);
        if (tab === 'documents') {
          setShowDocumentManager(true);
        }
      }}
      className={`px-6 py-3 rounded-lg ${currentTab === tab
        ? 'bg-blue-600 text-white'
        : 'bg-gray-200 text-gray-700 hover:bg-blue-500 hover:text-white'
        } transition-colors`}
    >
      {label}
    </button>
  );

  if (!user) {
    return <div>Please log in to access the dashboard.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="sm:hidden">
          <label htmlFor="tabs" className="sr-only">
            Select a tab
          </label>
          <select
            id="tabs"
            name="tabs"
            className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            defaultValue={activeTab}
            onChange={(e) => {
              const newTab = e.target.value as 'profiles' | 'conversations' | 'documents';
              setActiveTab(newTab);
              if (newTab === 'documents') {
                setShowDocumentManager(true);
              }
            }}
          >
            <option value="profiles">Student Profiles</option>
            <option value="conversations">Conversations</option>
            <option value="documents">Documents</option>
          </select>
        </div>
        <div className="hidden sm:block">
          <nav className="flex space-x-4" aria-label="Tabs">
            <TabButton
              tab="profiles"
              label="Student Profiles"
              setActiveTab={setActiveTab}
              activeTab={activeTab}
            />
            <TabButton
              tab="conversations"
              label="Conversations"
              setActiveTab={setActiveTab}
              activeTab={activeTab}
            />
            <TabButton
              tab="documents"
              label="Documents"
              setActiveTab={setActiveTab}
              activeTab={activeTab}
            />
          </nav>
        </div>

        {activeTab === 'profiles' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Student Profiles</h2>
              <button
                onClick={() => setShowAddChild(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-lg hover:from-blue-600 hover:to-green-600 transition-all"
              >
                <Plus size={20} />
                Add Student
              </button>
            </div>

            {children.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No student profiles yet.</p>
                <button
                  onClick={() => setShowAddChild(true)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-lg hover:from-blue-600 hover:to-green-600 transition-all"
                >
                  Create Your First Student Profile
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
            children={children}
            onLoadConversation={handleLoadConversation}
            onBack={handleBackToProfiles}
            profile={profile}
          />
        )}

        {activeTab === 'documents' && showDocumentManager && (
          <DocumentManager onClose={() => setShowDocumentManager(false)} />
        )}
      </div>

      {(showAddChild || editingChild) && (
        <AddChildForm
          onSave={handleAddChild}
          onCancel={() => {
            setShowAddChild(false);
            setEditingChild(null);
          }}
          editingChild={editingChild}
        />
      )}
    </div>
  );
};

export default Dashboard;
