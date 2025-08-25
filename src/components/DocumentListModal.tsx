import React from 'react';
import { X, FileText, Download, Calendar, Trash2 } from 'lucide-react';
import type { Tables } from '@/types/supabase';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface DocumentListModalProps {
  documents: Tables<'documents'>[];
  onClose: () => void;
  onDocumentDeleted?: (documentId: string) => void;
}

const DocumentListModal: React.FC<DocumentListModalProps> = ({
  documents,
  onClose,
  onDocumentDeleted
}) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDocumentTypeLabel = (type: string): string => {
    const typeMap: Record<string, string> = {
      'failed_test': 'Failed Test',
      'study_guide': 'Study Guide',
      'homework': 'Homework',
      'other': 'Other'
    };
    return typeMap[type] || type;
  };

  const handleDownload = async (doc: Tables<'documents'>) => {
    try {
      const response = await fetch(`/api/download-document?filePath=${encodeURIComponent(doc.file_path)}`);
      if (!response.ok) throw new Error('Download failed');
      
      // Create a blob from the response and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: try to open in new tab
      window.open(`/api/download-document?filePath=${encodeURIComponent(doc.file_path)}`, '_blank');
    }
  };

  const handleDelete = async (doc: Tables<'documents'>) => {
    if (!confirm(`Are you sure you want to delete "${doc.file_name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([doc.file_path]);
      
      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', doc.id);

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Document deleted successfully",
      });

      // Notify parent component to refresh the document list
      if (onDocumentDeleted) {
        onDocumentDeleted(doc.id);
      }

    } catch (error: any) {
      console.error('Delete failed:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Documents in this Conversation
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          {documents.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <FileText size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No documents uploaded to this conversation yet.</p>
              <p className="text-sm mt-2">Upload documents to see them here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((document) => (
                <div key={document.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        <FileText size={20} className="text-blue-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-gray-800 truncate">
                          {document.file_name}
                        </h4>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {formatDate(document.created_at)}
                          </span>
                          <span>{formatFileSize(document.file_size)}</span>
                          <span className="capitalize">{getDocumentTypeLabel(document.document_type)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownload(document)}
                        className="flex-shrink-0 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Download document"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(document)}
                        className="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete document"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  {document.description && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Description:</span> {document.description}
                      </p>
                    </div>
                  )}
                  
                  {document.subject && document.subject.trim() !== '' && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Subject:</span> {document.subject}
                      </p>
                    </div>
                  )}
                  

                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              {documents.length} document{documents.length !== 1 ? 's' : ''} in this conversation
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentListModal; 