
import React from 'react';
import { File, Download, Trash2, Brain, RefreshCw, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { DocumentData, Child } from '@/types/database';

interface DocumentListProps {
  documents: DocumentData[];
  children?: Child[];
  onDocumentDeleted: () => void;
}

const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  children = [],
  onDocumentDeleted
}) => {
  const { profile } = useAuth();
  const { toast } = useToast();

  const getDocumentTypeColor = (type: string) => {
    switch (type) {
      case 'failed_test':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'study_guide':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'homework':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
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

  const getChildName = (childId: string | undefined | null) => {
    if (!childId) return null;
    const child = children.find(c => c.id === childId);
    return child?.name;
  };

  const getProcessingStatusBadge = (status: string | null | undefined) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-300">Processing...</Badge>;
      case 'processing':
        return <Badge variant="outline" className="text-blue-600 border-blue-300">Processing...</Badge>;
      case 'completed':
        return <Badge variant="outline" className="text-green-600 border-green-300">Completed</Badge>;
      case 'failed':
        return <Badge variant="outline" className="text-red-600 border-red-300">Failed</Badge>;
      default:
        return null;
    }
  };

  const handleDownload = async (document: DocumentData) => {
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

      toast({
        title: "Download started",
        description: `Downloading ${document.file_name}`,
      });

    } catch (error: any) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: error.message || "Failed to download document",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (document: DocumentData) => {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }

    try {
      // Delete from storage first
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([document.file_path]);

      if (storageError) {
        console.warn('Storage deletion failed:', storageError);
        // Continue with database deletion even if storage fails
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', document.id);

      if (dbError) throw dbError;

      toast({
        title: "Document deleted",
        description: "Document has been successfully deleted",
      });

      onDocumentDeleted();

    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  const handleReprocess = async (document: DocumentData) => {
    if (document.file_type !== 'application/pdf') {
      toast({
        title: "Cannot reprocess",
        description: "Only PDF documents can be reprocessed",
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: "Processing started",
        description: "Attempting to re-process the PDF document...",
      });

      // Download the file from storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('documents')
        .download(document.file_path);

      if (downloadError) throw downloadError;

      // Create a File object from the downloaded data
      const file = new globalThis.File([fileData], document.file_name, { type: document.file_type });

      // Get learner name
      const child = children?.find(c => c.id === document.child_id);
      const learnerName = child?.name || 'Student';

      // Import and use the processing service
      const { processDocument } = await import('@/services/documentProcessingService');
      const result = await processDocument(document.id, file, learnerName);

      if (result.error) {
        toast({
          title: "Processing failed",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Processing successful",
          description: "Document has been re-processed successfully",
        });
        onDocumentDeleted(); // Refresh the list
      }

    } catch (error: any) {
      console.error('Reprocess error:', error);
      toast({
        title: "Processing failed",
        description: error.message || "Failed to re-process document",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No documents uploaded yet</h3>
          <p className="text-gray-500">Upload your first document to get started with AI-powered analysis.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {documents.map((doc) => (
        <Card key={doc.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4 flex-1">
                <div className="p-2 bg-gray-50 rounded-lg">
                  <File className="h-6 w-6 text-gray-600" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-base font-medium text-gray-900 truncate">
                      {doc.file_name}
                    </h3>
                    <Badge className={getDocumentTypeColor(doc.document_type)}>
                      {getDocumentTypeLabel(doc.document_type)}
                    </Badge>
                    {getProcessingStatusBadge(doc.processing_status)}
                  </div>
                  
                  {doc.description && (
                    <p className="text-sm text-gray-600 mb-3">{doc.description}</p>
                  )}
                  
                  {doc.ai_analysis && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">AI Analysis</span>
                      </div>
                      <div className="text-sm text-blue-800">
                        <p>
                          📊 Accuracy: {(doc.ai_analysis as any).accuracy || 0}% • 
                          ❌ Areas to improve: {(doc.ai_analysis as any).incorrectAnswers || 0}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {doc.processing_error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-medium text-red-900">Processing Error</span>
                      </div>
                      <p className="text-sm text-red-800 mt-1">{doc.processing_error}</p>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{formatFileSize(doc.file_size)}</span>
                    {doc.subject && <span>Subject: {doc.subject}</span>}
                    {profile?.user_type === 'parent' && doc.child_id && (
                      <span>Child: {getChildName(doc.child_id)}</span>
                    )}
                    <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                {doc.file_type === 'application/pdf' && doc.processing_status === 'failed' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleReprocess(doc)}
                    className="text-blue-600 hover:text-blue-700"
                    title="Reprocess PDF"
                  >
                    <RefreshCw size={16} />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(doc)}
                  className="text-blue-600 hover:text-blue-700"
                  title="Download"
                >
                  <Download size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(doc)}
                  className="text-red-600 hover:text-red-700"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DocumentList;
