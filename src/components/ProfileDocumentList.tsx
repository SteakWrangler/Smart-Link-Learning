import React, { useState, useEffect } from 'react';
import { FileText, Download, Trash2, FolderOpen, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { DocumentData } from '@/types/database';

interface DocumentWithConversation extends DocumentData {
  conversation_title?: string;
  conversation_id?: string;
}

interface ProfileDocumentListProps {
  onViewInConversation?: (conversationId: string) => void;
}

const ProfileDocumentList: React.FC<ProfileDocumentListProps> = ({ 
  onViewInConversation 
}) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<DocumentWithConversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchDocuments();
    }
  }, [profile]);

  const fetchDocuments = async () => {
    if (!profile) return;

    try {
      setLoading(true);

      // Query documents with their associated conversation titles
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          conversation_documents!inner (
            conversation_id,
            conversations (
              id,
              title
            )
          )
        `)
        .eq('user_id', profile.id)
        .order('file_name', { ascending: true });

      if (error) throw error;

      // Transform the data to include conversation details
      const documentsWithConversations: DocumentWithConversation[] = (data || []).map(doc => ({
        ...doc,
        document_type: doc.document_type as "failed_test" | "study_guide" | "homework" | "other",
        processing_status: doc.processing_status as "pending" | "processing" | "completed" | "failed",
        conversation_title: (doc.conversation_documents as any)?.[0]?.conversations?.title,
        conversation_id: (doc.conversation_documents as any)?.[0]?.conversations?.id,
      }));

      setDocuments(documentsWithConversations);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (document: DocumentWithConversation) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(document.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.file_name;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error: any) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: error.message || "Failed to download document",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (document: DocumentWithConversation) => {
    if (!confirm(`Are you sure you want to delete "${document.file_name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([document.file_path]);

      if (storageError) throw storageError;

      // Delete from database (cascade will handle conversation_documents)
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', document.id);

      if (dbError) throw dbError;

      toast({
        title: "Document deleted",
        description: `"${document.file_name}" has been successfully deleted`,
      });

      // Refresh the list
      fetchDocuments();

    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  const getDocumentTypeColor = (type: string) => {
    switch (type) {
      case 'failed_test':
        return 'bg-red-100 text-red-700';
      case 'study_guide':
        return 'bg-blue-100 text-blue-700';
      case 'homework':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'failed_test':
        return 'Failed Test';
      case 'study_guide':
        return 'Study Guide';
      case 'homework':
        return 'Homework';
      default:
        return 'Other';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="ml-3 text-gray-600">Loading documents...</p>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <FileText className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
          <p className="text-gray-500 mb-4">
            Upload documents in your conversations to see them here.
          </p>
          <p className="text-sm text-gray-400">
            Documents you upload during chats will automatically appear in this list.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600">
          {documents.length} document{documents.length !== 1 ? 's' : ''} uploaded across your conversations
        </p>
      </div>

      {documents.map((doc) => (
        <Card key={doc.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1 min-w-0">
                <FileText className="h-5 w-5 text-gray-400 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {doc.file_name}
                    </h3>
                    <Badge className={getDocumentTypeColor(doc.document_type)}>
                      {getDocumentTypeLabel(doc.document_type)}
                    </Badge>
                  </div>
                  
                  {/* Conversation context */}
                  {doc.conversation_title && (
                    <div className="flex items-center gap-1 mb-2">
                      <FolderOpen className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-600 truncate">
                        {doc.conversation_title}
                      </span>
                    </div>
                  )}
                  
                  {doc.description && (
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">{doc.description}</p>
                  )}
                  
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{formatFileSize(doc.file_size)}</span>
                    {doc.subject && <span>Subject: {doc.subject}</span>}
                    <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-1 ml-2">
                {doc.conversation_id && onViewInConversation && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewInConversation(doc.conversation_id!)}
                    className="text-blue-600 hover:text-blue-700 px-2"
                    title="View in conversation"
                  >
                    <MessageSquare size={14} />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(doc)}
                  className="text-gray-600 hover:text-gray-700 px-2"
                  title="Download"
                >
                  <Download size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(doc)}
                  className="text-red-600 hover:text-red-700 px-2"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ProfileDocumentList;