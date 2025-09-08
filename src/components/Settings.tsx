import React, { useState } from 'react';
import { Settings as SettingsIcon, User, Shield, Bell, Trash2, Save, X, Eye, EyeOff, Check, FileText, CreditCard } from 'lucide-react';
import { Profile } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { validatePassword, getPasswordRequirementsList } from '@/utils/passwordValidation';
import { openBillingPortal } from '@/utils/billing';
import ProfileDocumentList from './ProfileDocumentList';

interface SettingsProps {
  profile: Profile;
  onBack: () => void;
  resetTokens?: {accessToken: string, refreshToken: string} | null;
}

const Settings: React.FC<SettingsProps> = ({ profile, onBack, resetTokens }) => {
  const { toast } = useToast();
  const { fetchProfile, setProfile, isSubscriptionActive } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(!!resetTokens); // Auto-show if reset tokens provided
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [isPasswordReset, setIsPasswordReset] = useState(!!resetTokens); // Track if this is a reset flow
  
  // Form states
  const [formData, setFormData] = useState({
    first_name: profile.first_name || '',
    last_name: profile.last_name || '',
    is_anonymous_in_forum: profile.is_anonymous_in_forum || false,
    email_notifications: profile.email_notifications !== false, // Default to true
    forum_notifications: profile.forum_notifications !== false, // Default to true
  });

  // Password change states
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  // Email change states
  const [emailData, setEmailData] = useState({
    new_email: '',
    password: '',
  });

  // Delete account states
  const [deletePassword, setDeletePassword] = useState('');

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      // Optimistic update - update the UI immediately
      const updatedProfile = {
        ...profile,
        first_name: formData.first_name,
        last_name: formData.last_name,
        is_anonymous_in_forum: formData.is_anonymous_in_forum,
        email_notifications: formData.email_notifications,
        forum_notifications: formData.forum_notifications,
        updated_at: new Date().toISOString(),
      };
      
      // Update the profile state immediately for instant UI feedback
      setProfile(updatedProfile);

      // Then update the database
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          is_anonymous_in_forum: formData.is_anonymous_in_forum,
          email_notifications: formData.email_notifications,
          forum_notifications: formData.forum_notifications,
        })
        .eq('id', profile.id);

      if (error) throw error;

      // Fetch the latest profile to ensure consistency
      await fetchProfile(profile.id);

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      
      // Revert the optimistic update on error
      setProfile(profile);
      
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    // Skip current password validation for reset flows
    if (!isPasswordReset && !passwordData.current_password.trim()) {
      toast({
        title: "Error",
        description: "Current password is required.",
        variant: "destructive",
      });
      return;
    }

    // Validate new password requirements
    if (passwordData.new_password.trim()) {
      const passwordValidation = validatePassword(passwordData.new_password);
      if (!passwordValidation.isValid) {
        toast({
          title: "Password Requirements Not Met",
          description: passwordValidation.errors.join(', '),
          variant: "destructive",
        });
        return;
      }
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Skip current password verification for reset flows
      if (!isPasswordReset) {
        // First, verify the current password by attempting to sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: profile.email,
          password: passwordData.current_password,
        });

        if (signInError) {
          toast({
            title: "Error",
            description: "Current password is incorrect.",
            variant: "destructive",
          });
          return;
        }
      }

      // Update to new password
      const { error } = await supabase.auth.updateUser({
        password: passwordData.new_password
      });

      if (error) throw error;

      toast({
        title: "Password Updated",
        description: "Your password has been successfully updated.",
      });
      
      setShowPasswordChange(false);
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
      
      // Clear reset state if this was a password reset
      if (isPasswordReset) {
        setIsPasswordReset(false);
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: "Error",
        description: "Failed to change password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEmail = async () => {
    // Validate that password is provided
    if (!emailData.password.trim()) {
      toast({
        title: "Error",
        description: "Password is required to change email.",
        variant: "destructive",
      });
      return;
    }

    // Validate email format
    if (!emailData.new_email.trim() || !emailData.new_email.includes('@')) {
      toast({
        title: "Error",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // First, verify the current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: emailData.password,
      });

      if (signInError) {
        toast({
          title: "Error",
          description: "Password is incorrect.",
          variant: "destructive",
        });
        return;
      }

      // If password is correct, update email
      const { error } = await supabase.auth.updateUser({
        email: emailData.new_email
      });

      if (error) throw error;

      toast({
        title: "Email Update Requested",
        description: "Please check your new email for a confirmation link.",
      });
      
      setShowEmailChange(false);
      setEmailData({
        new_email: '',
        password: '',
      });
    } catch (error) {
      console.error('Error changing email:', error);
      toast({
        title: "Error",
        description: "Failed to change email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    // Validate that password is provided
    if (!deletePassword.trim()) {
      toast({
        title: "Error",
        description: "Password is required to delete your account.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // First, verify the current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: deletePassword,
      });

      if (signInError) {
        toast({
          title: "Error",
          description: "Password is incorrect.",
          variant: "destructive",
        });
        return;
      }

      // If password is correct, mark the account as deleted
      // This will prevent the user from logging in while preserving the auth account
      
      // Delete user documents
      const { error: documentsError } = await supabase
        .from('documents')
        .delete()
        .eq('user_id', profile.id);

      if (documentsError) {
        console.error('Error deleting user documents:', documentsError);
        // Continue with deletion even if documents deletion fails
      }

      // Delete user conversations and messages
      const { error: conversationsError } = await supabase
        .from('conversations')
        .delete()
        .eq('parent_id', profile.id);

      if (conversationsError) {
        console.error('Error deleting user conversations:', conversationsError);
        // Continue with deletion even if conversations deletion fails
      }

      // Delete forum posts and topics
      const { error: forumPostsError } = await supabase
        .from('forum_posts')
        .delete()
        .eq('author_id', profile.id);

      if (forumPostsError) {
        console.error('Error deleting forum posts:', forumPostsError);
        // Continue with deletion even if forum posts deletion fails
      }

      const { error: forumTopicsError } = await supabase
        .from('forum_topics')
        .delete()
        .eq('author_id', profile.id);

      if (forumTopicsError) {
        console.error('Error deleting forum topics:', forumTopicsError);
        // Continue with deletion even if forum topics deletion fails
      }

      // Mark the profile as deleted instead of deleting it
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          deleted_at: new Date().toISOString(),
          first_name: '',
          last_name: '',
          email_notifications: false,
          forum_notifications: false,
          is_anonymous_in_forum: false
        })
        .eq('id', profile.id);

      if (profileError) throw profileError;

      // Sign out the user
      await supabase.auth.signOut();

      toast({
        title: "Account Deleted",
        description: "Your account has been deleted. You will be signed out and will need to create a new account to use the app again.",
      });
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: "Error",
        description: "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
      setDeletePassword('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <X size={20} />
                Back
              </button>
              <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="space-y-8">
          {/* Personal Information Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <User className="text-blue-600" size={24} />
              <h2 className="text-xl font-semibold text-gray-800">Personal Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                  <Button
                    onClick={() => setShowEmailChange(true)}
                    variant="outline"
                    size="sm"
                  >
                    Change
                  </Button>
                </div>
              </div>
            </div>
            
            <Button
              onClick={handleSaveProfile}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Save size={16} className="mr-2" />
              Save Changes
            </Button>
          </div>

          {/* Privacy Settings Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="text-green-600" size={24} />
              <h2 className="text-xl font-semibold text-gray-800">Privacy Settings</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-800">Anonymous Forum Posting</h3>
                  <p className="text-sm text-gray-600">Post in the community forum without showing your name</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_anonymous_in_forum}
                    onChange={(e) => handleInputChange('is_anonymous_in_forum', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-800">Email Notifications</h3>
                  <p className="text-sm text-gray-600">Receive email notifications for important updates</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.email_notifications}
                    onChange={(e) => handleInputChange('email_notifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-800">Forum Notifications</h3>
                  <p className="text-sm text-gray-600">Receive notifications for forum activity</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.forum_notifications}
                    onChange={(e) => handleInputChange('forum_notifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* My Documents Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="text-purple-600" size={24} />
              <h2 className="text-xl font-semibold text-gray-800">My Documents</h2>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                View and manage all documents uploaded across your conversations.
              </p>
            </div>
            
            <ProfileDocumentList />
          </div>

          {/* Billing Management Section */}
          {isSubscriptionActive && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <CreditCard className="text-blue-600" size={24} />
                <h2 className="text-xl font-semibold text-gray-800">Billing Management</h2>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Manage your subscription, view billing history, and update payment methods.
                </p>
              </div>
              
              <Button
                onClick={async () => {
                  try {
                    await openBillingPortal();
                  } catch (error) {
                    console.error('Failed to open billing portal:', error);
                    toast({
                      title: "Error",
                      description: "Failed to open billing portal. Please try again or contact support.",
                      variant: "destructive",
                    });
                  }
                }}
                variant="outline"
                className="w-full justify-start"
              >
                <CreditCard size={16} className="mr-2" />
                Manage Billing & Subscription
              </Button>
            </div>
          )}

          {/* Account Management Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <SettingsIcon className="text-orange-600" size={24} />
              <h2 className="text-xl font-semibold text-gray-800">Account Management</h2>
            </div>
            
            <div className="space-y-4">
              <Button
                onClick={() => setShowPasswordChange(true)}
                variant="outline"
                className="w-full justify-start"
              >
                <Shield size={16} className="mr-2" />
                Change Password
              </Button>
              
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                variant="outline"
                className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 size={16} className="mr-2" />
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordChange && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {isPasswordReset ? "Set New Password" : "Change Password"}
            </h3>
            
            <div className="space-y-4">
              {/* Only show current password field if not a reset flow */}
              {!isPasswordReset && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.current_password}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, current_password: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                
                {/* Password Requirements */}
                {passwordData.new_password && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</p>
                    <div className="space-y-1">
                      {(() => {
                        const validation = validatePassword(passwordData.new_password);
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
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setShowPasswordChange(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleChangePassword}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isPasswordReset ? "Set Password" : "Change Password"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Email Change Modal */}
      {showEmailChange && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Change Email</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Email Address
                </label>
                <input
                  type="email"
                  value={emailData.new_email}
                  onChange={(e) => setEmailData(prev => ({ ...prev, new_email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={emailData.password}
                  onChange={(e) => setEmailData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setShowEmailChange(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleChangeEmail}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Change Email
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <Trash2 className="text-red-600" size={24} />
              <h3 className="text-lg font-semibold text-gray-800">Delete Account</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data.
            </p>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter your password to confirm
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter your current password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletePassword('');
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteAccount}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings; 