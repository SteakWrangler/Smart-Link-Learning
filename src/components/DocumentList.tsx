
import React, { useState, useEffect } from 'react';
import { File, Download, Trash2, Eye, Brain, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  const getChildName = (childId: string | undefined | null) => {
    if (!childId) return null;
    const child = children.find(c => c.id === childId);
    return child?.name;
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
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([document.file_path]);

      if (storageError) throw storageError;

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
    if (document.file_type !== 'application/pdf') return;

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
      const file = new File([fileData], document.file_name, { type: document.file_type });

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
        <CardContent className="text-center py-8">
          <File className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">No documents uploaded yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {documents.map((doc) => (
        <Card key={doc.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <File className="h-8 w-8 text-gray-400 mt-1" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {doc.file_name}
                    </h3>
                    <Badge className={getDocumentTypeColor(doc.document_type)}>
                      {getDocumentTypeLabel(doc.document_type)}
                    </Badge>
                    {doc.extracted_content && (
                      <Badge variant="outline" className="text-blue-600">
                        <Brain size={12} className="mr-1" />
                        Analyzed
                      </Badge>
                    )}
                  </div>
                  
                  {doc.description && (
                    <p className="text-sm text-gray-600 mb-2">{doc.description}</p>
                  )}
                  
                  {doc.ai_analysis && (
                    <div className="text-xs text-blue-600 mb-2">
                      <p>📊 Analysis: {(doc.ai_analysis as any).accuracy}% accuracy, {(doc.ai_analysis as any).incorrectAnswers} areas to improve</p>
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
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(doc)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Download size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(doc)}
                  className="text-red-600 hover:text-red-700"
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
