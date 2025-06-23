
import React, { useState, useEffect } from 'react';
import { FileText, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import DocumentUpload from './DocumentUpload';
import DocumentList from './DocumentList';
import type { DocumentData, Child, Subject } from '@/types/database';

interface DocumentManagerProps {
  onClose: () => void;
}

const DocumentManager: React.FC<DocumentManagerProps> = ({ onClose }) => {
  const { profile } = useAuth();
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    if (profile) {
      fetchData();
    }
  }, [profile]);

  const fetchData = async () => {
    if (!profile) return;

    try {
      setLoading(true);

      // Fetch documents
      const { data: documentsData, error: documentsError } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (documentsError) throw documentsError;
      
      // Type assertion to ensure proper typing with null safety
      const typedDocuments: DocumentData[] = (documentsData || []).map(doc => ({
        ...doc,
        document_type: doc.document_type as 'failed_test' | 'study_guide' | 'homework' | 'other',
        processing_status: doc.processing_status as 'pending' | 'processing' | 'completed' | 'failed' | null,
        child_id: doc.child_id as string | null,
        description: doc.description as string | null,
        subject: doc.subject as string | null,
        extracted_content: doc.extracted_content as string | null,
        processing_error: doc.processing_error as string | null
      }));
      
      setDocuments(typedDocuments);

      // Fetch subjects
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('subjects')
        .select('*');

      if (subjectsError) throw subjectsError;
      setSubjects(subjectsData || []);

      // If parent, fetch children
      if (profile.user_type === 'parent') {
        const { data: childrenData, error: childrenError } = await supabase
          .from('children')
          .select('*')
          .eq('parent_id', profile.id);

        if (childrenError) throw childrenError;
        console.log('Fetched children for document manager:', childrenData);
        setChildren(childrenData || []);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = () => {
    setShowUpload(false);
    fetchData();
  };

  const handleDocumentDeleted = () => {
    fetchData();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText size={24} />
            Document Manager
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {!showUpload ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-gray-600">
                  Upload and manage documents like failed tests, study guides, and homework.
                </p>
                <Button onClick={() => setShowUpload(true)} className="flex items-center gap-2">
                  <Plus size={16} />
                  Upload Document
                </Button>
              </div>

              <DocumentList
                documents={documents}
                children={children}
                onDocumentDeleted={handleDocumentDeleted}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Upload New Document</h3>
                <Button variant="outline" onClick={() => setShowUpload(false)}>
                  Cancel
                </Button>
              </div>

              <DocumentUpload
                children={children}
                subjects={subjects}
                onUploadComplete={handleUploadComplete}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentManager;
