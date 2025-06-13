
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Auth from './Auth';
import Dashboard from './Dashboard';
import StudentDashboard from './StudentDashboard';
import WelcomeSection from './WelcomeSection';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';

const AuthenticatedApp = () => {
  const { user, profile, loading, signOut } = useAuth();
  const [showDashboard, setShowDashboard] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <Auth onAuthSuccess={() => setShowDashboard(true)} />;
  }

  if (showDashboard) {
    return <Dashboard />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Joyful Learner</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-600">
              <User size={20} />
              <span>Welcome, {profile.first_name || profile.email}</span>
            </div>
            <Button
              onClick={signOut}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <LogOut size={16} />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-6">
        <WelcomeSection onGetStarted={() => setShowDashboard(true)} />
      </div>
    </div>
  );
};

export default AuthenticatedApp;
