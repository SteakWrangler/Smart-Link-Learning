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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Check, X } from 'lucide-react';
import { validatePassword, getPasswordRequirementsList } from '@/utils/passwordValidation';

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
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);

  // Check for password reset parameters on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const resetParam = urlParams.get('reset');
    const accessToken = urlParams.get('access_token');
    const refreshToken = urlParams.get('refresh_token');
    
    if (resetParam === 'true' && accessToken && refreshToken) {
      // Set the session with the tokens from the password reset link
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      }).then(({ data, error }) => {
        if (!error && data.session) {
          setShowPasswordReset(true);
          // Clear the URL parameters
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      });
    }
  }, []);

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

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword.trim()) {
      toast({
        title: "Error",
        description: "Please enter a new password.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    // Validate password requirements
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      toast({
        title: "Password Requirements Not Met",
        description: passwordValidation.errors.join(', '),
        variant: "destructive",
      });
      return;
    }

    setPasswordResetLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Password Reset Successfully",
        description: "Your password has been updated. You can now sign in with your new password.",
      });
      
      setShowPasswordReset(false);
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPasswordResetLoading(false);
    }
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

  return (
    <>
      <div>Authenticated App</div>
      
      {/* Password Reset Modal */}
      {showPasswordReset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="text-green-600" size={24} />
              <h3 className="text-lg font-semibold text-gray-800">Set New Password</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Please enter your new password below.
            </p>
            
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password" className="flex items-center">
                  New Password <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter your new password"
                  required
                />
                
                {/* Password Requirements */}
                {newPassword && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</p>
                    <div className="space-y-1">
                      {(() => {
                        const validation = validatePassword(newPassword);
                        return getPasswordRequirementsList().map((requirement, index) => {
                          const isMet = Object.values(validation.requirements)[index];
                          return (
                            <div key={index} className="flex items-center text-xs">
                              {isMet ? (
                                <Check className="mr-2 text-green-500" size={14} />
                              ) : (
                                <X className="mr-2 text-red-500" size={14} />
                              )}
                              <span className={isMet ? "text-green-700" : "text-red-700"}>
                                {requirement}
                              </span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-new-password" className="flex items-center">
                  Confirm New Password <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="confirm-new-password"
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  required
                />
              </div>
              
              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={() => setShowPasswordReset(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={passwordResetLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  {passwordResetLoading ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AuthenticatedApp;
