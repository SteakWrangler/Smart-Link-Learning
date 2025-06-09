
import React, { useState } from 'react';
import { Plus, MessageSquare, Star, LifeBuoy, ArrowLeft } from 'lucide-react';
import { Child, SavedConversation } from '../types';
import ChildProfile from './ChildProfile';
import AddChildForm from './AddChildForm';
import ConversationHistory from './ConversationHistory';
import ChatInterface from './ChatInterface';

interface DashboardProps {
  onBack: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onBack }) => {
  const [children, setChildren] = useState<Child[]>([]);
  const [savedConversations, setSavedConversations] = useState<SavedConversation[]>([]);
  const [showAddChild, setShowAddChild] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | undefined>();
  const [selectedChild, setSelectedChild] = useState<Child | undefined>();
  const [activeTab, setActiveTab] = useState<'children' | 'conversations' | 'support'>('children');
  const [showChat, setShowChat] = useState(false);

  const handleAddChild = (childData: Omit<Child, 'id' | 'createdAt'>) => {
    if (editingChild) {
      setChildren(prev => prev.map(child => 
        child.id === editingChild.id 
          ? { ...childData, id: editingChild.id, createdAt: editingChild.createdAt }
          : child
      ));
      setEditingChild(undefined);
    } else {
      const newChild: Child = {
        ...childData,
        id: Date.now().toString(),
        createdAt: new Date()
      };
      setChildren(prev => [...prev, newChild]);
    }
    setShowAddChild(false);
  };

  const handleEditChild = (child: Child) => {
    setEditingChild(child);
    setShowAddChild(true);
  };

  const handleDeleteChild = (childId: string) => {
    if (confirm('Are you sure you want to delete this child profile?')) {
      setChildren(prev => prev.filter(child => child.id !== childId));
      setSavedConversations(prev => prev.filter(conv => conv.childId !== childId));
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
