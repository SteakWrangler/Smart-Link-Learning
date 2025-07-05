import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { useAuth } from '@/hooks/useAuth';
import Dashboard from './Dashboard';
import StudentDashboard from './StudentDashboard';
import ChatInterface from './ChatInterface';
import ConversationHistory from './ConversationHistory';
import CategorySelector from './CategorySelector';
import WelcomeSection from './WelcomeSection';
import FeatureDetail from './FeatureDetail';
import Auth from './Auth';
import { Child, SavedConversation } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

const AuthenticatedApp: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [currentView, setCurrentView] = useState<'welcome' | 'dashboard' | 'category-selector' | 'chat' | 'conversation-history' | 'feature-detail'>('welcome');
  const [showAuth, setShowAuth] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState({
    subject: '',
    ageGroup: '',
    challenge: ''
  });
  const [loadedConversation, setLoadedConversation] = useState<SavedConversation | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<string>('');
  const [redirectToTab, setRedirectToTab] = useState<string>('');

  // Clear redirect tab after it's been used
  useEffect(() => {
    if (redirectToTab && currentView === 'dashboard') {
      // Clear the redirect tab after a short delay to ensure it's been applied
      const timer = setTimeout(() => {
        setRedirectToTab('');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [redirectToTab, currentView]);

  useEffect(() => {
    const fetchChildren = async () => {
      if (!profile?.id) {
        console.error('No profile ID available');
        return;
      }

      try {
        let query = supabase
          .from('children')
          .select('*')
          .eq('parent_id', profile.id)
          .order('created_at', { ascending: false });

        const { data: childrenData, error } = await query;

        if (error) {
          console.error('Error fetching children:', error);
          toast({
            title: 'Error',
            description: 'Failed to load students. Please try again.',
            variant: 'destructive'
          });
          return;
        }

        if (childrenData) {
          // Transform database children to match Child type
          const transformedChildren: Child[] = childrenData.map(dbChild => ({
            id: dbChild.id,
            name: dbChild.name,
            ageGroup: dbChild.age_group,
            subjects: [], // Will be populated when needed
            challenges: [], // Will be populated when needed
            createdAt: new Date(dbChild.created_at)
          }));
          setChildren(transformedChildren);
        } else {
          setChildren([]);
        }
      } catch (error) {
        console.error('Error fetching children:', error);
        toast({
          title: 'Error',
          description: 'Failed to load students. Please try again.',
          variant: 'destructive'
        });
      }
    };

    if (profile?.user_type === 'parent') {
      fetchChildren();
    }
  }, [profile]);

  const handleStartChat = (child: Child) => {
    console.log('Starting chat with child:', child);
    setSelectedChild(child);
    setLoadedConversation(null); // Clear any loaded conversation when starting fresh
    setCurrentView('category-selector');
  };

  const handleCategoriesSelected = (categories: any) => {
    console.log('Categories selected:', categories);
    setSelectedCategories(categories);
    setCurrentView('chat');
  };

  const handleBackFromChat = () => {
    console.log('Returning from chat to dashboard');
    setLoadedConversation(null); // Clear loaded conversation when going back
    setCurrentView('dashboard');
  };

  const handleBackFromCategories = () => {
    console.log('Returning from categories to dashboard');
    setCurrentView('dashboard');
  };

  const handleBackFromHistory = () => {
    console.log('Returning from conversation history to dashboard');
    setCurrentView('dashboard');
  };

  const handleViewConversationHistory = (child: Child) => {
    console.log('Viewing conversation history for child:', child);
    setSelectedChild(child);
    setCurrentView('conversation-history');
  };

  const handleLoadConversation = async (conversation: SavedConversation) => {
    console.log('Loading conversation:', conversation);
    console.log('Setting loaded conversation and navigating to chat');
    
    // Find the child for this conversation
    const child = children.find(c => c.id === conversation.childId);
    if (!child) {
      console.error('Child not found for conversation:', conversation.childId);
      toast({
        title: 'Error',
        description: 'Student not found for this conversation',
        variant: 'destructive'
      });
      return;
    }

    console.log('Found child for conversation:', child);
    
    // Set the selected child and loaded conversation
    setSelectedChild(child);
    setLoadedConversation(conversation);
    
    // Navigate to chat interface
    console.log('Navigating to chat with loaded conversation');
    setCurrentView('chat');
  };

  const handleSaveConversation = (conversation: any) => {
    console.log('Conversation saved:', conversation);
    toast({
      title: 'Success',
      description: 'Conversation saved successfully!',
    });
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setShowAuth(false);
      setCurrentView('welcome');
      toast({
        title: 'Signed Out',
        description: 'You have been successfully signed out.',
      });
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: 'Error',
        description: 'Failed to sign out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleFeatureClick = (featureId: string) => {
    setSelectedFeature(featureId);
    setCurrentView('feature-detail');
  };

  const handleBackFromFeature = () => {
    setCurrentView('welcome');
    setSelectedFeature('');
    setRedirectToTab('');
  };

  // Map features to dashboard tabs
  const getFeatureRedirectTab = (featureId: string): string => {
    const featureTabMap: Record<string, string> = {
      'ai-interactive-learning': 'conversations',
      'parent-support': 'support',
      'personalized-learning-setup': 'children',
      'chat-history': 'conversations',
      'settings': 'settings'
    };
    return featureTabMap[featureId] || 'children';
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  // Show auth screen if user is not authenticated and showAuth is true
  if (!user && showAuth) {
    return <Auth 
      onAuthSuccess={() => {
        setShowAuth(false);
        if (redirectToTab) {
          setCurrentView('dashboard');
          // The dashboard will handle the tab redirect
        } else {
          setCurrentView('dashboard');
        }
      }}
      onBack={() => {
        setShowAuth(false);
        setCurrentView('welcome');
        setRedirectToTab('');
      }}
    />;
  }

  // Show feature detail screen
  if (currentView === 'feature-detail') {
    return (
      <FeatureDetail
        featureId={selectedFeature}
        onBack={handleBackFromFeature}
        onGetStarted={() => {
          if (user) {
            setCurrentView('dashboard');
            setRedirectToTab(getFeatureRedirectTab(selectedFeature));
          } else {
            setRedirectToTab(getFeatureRedirectTab(selectedFeature));
            setShowAuth(true);
          }
        }}
      />
    );
  }

  // Show welcome screen for all users (authenticated and unauthenticated)
  if (currentView === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-4 sm:p-6">
        <div className="max-w-6xl mx-auto w-full">
          <WelcomeSection 
            isAuthenticated={!!user}
            user={user}
            profile={profile}
            onSignIn={() => setShowAuth(true)}
            onSignUp={() => setShowAuth(true)}
            onGetStarted={() => {
              if (user) {
                setCurrentView('dashboard');
                setRedirectToTab('children'); // Default to children tab for main Get Started
              } else {
                setRedirectToTab('children'); // Default to children tab for main Get Started
                setShowAuth(true);
              }
            }}
            onSignOut={handleSignOut}
            onFeatureClick={handleFeatureClick}
          />
        </div>
      </div>
    );
  }

  if (profile?.user_type === 'parent') {
    return (
      <>
        {currentView === 'dashboard' && (
          <Dashboard 
            onBack={() => setCurrentView('welcome')}
            initialTab={redirectToTab}
          />
        )}
        {currentView === 'category-selector' && selectedChild && (
          <CategorySelector
            selectedCategories={selectedCategories}
            onCategoryChange={(type: string, value: string) => {
              setSelectedCategories(prev => ({
                ...prev,
                [type]: value
              }));
            }}
            onBack={handleBackFromCategories}
            onCategoriesSelected={handleCategoriesSelected}
          />
        )}
        {currentView === 'chat' && selectedChild && (
          <ChatInterface
            selectedCategories={selectedCategories}
            onBack={handleBackFromChat}
            selectedChild={selectedChild}
            onSaveConversation={handleSaveConversation}
            loadedConversation={loadedConversation}
          />
        )}
        {currentView === 'conversation-history' && selectedChild && (
          <ConversationHistory
            children={children}
            onLoadConversation={handleLoadConversation}
            onBack={handleBackFromHistory}
            profile={profile}
          />
        )}
      </>
    );
  }

  if (profile?.user_type === 'student') {
    return (
      <StudentDashboard onBack={() => {}} />
    );
  }

  return <div>Authenticated App</div>;
};

export default AuthenticatedApp;
