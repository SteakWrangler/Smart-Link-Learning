
import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FileInput } from '@/components/ui/file-input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Child, Subject } from '@/types/database';

interface DocumentUploadProps {
  children?: Child[];
  subjects: Subject[];
  onUploadComplete: () => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  children,
  subjects,
  onUploadComplete
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<'failed_test' | 'study_guide' | 'homework' | 'other'>('other');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [selectedChild, setSelectedChild] = useState('');
  const [uploading, setUploading] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();

  // Find the current user's child profile for students
  const currentChild = children?.find(child => child.parent_id === profile?.id);

  useEffect(() => {
    if (profile?.user_type === 'student' && !currentChild) {
      toast({
        title: "Info",
        description: "Please complete your profile to upload documents.",
      });
    }
  }, [profile, currentChild, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile || !selectedFile) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Create unique file path
      const fileExtension = selectedFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExtension}`;
      const filePath = `${profile.id}/${fileName}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Create document record
      const documentData = {
        user_id: profile.id,
        child_id: profile.user_type === 'parent' ? selectedChild : currentChild?.id || null,
        file_name: selectedFile.name,
        file_path: filePath,
        file_size: selectedFile.size,
        file_type: selectedFile.type,
        document_type: documentType,
        description: description || null,
        subject: subject || null,
      };

      const { data: document, error: dbError } = await supabase
        .from('documents')
        .insert(documentData)
        .select()
        .single();

      if (dbError) throw dbError;

      // Process PDF content if it's a PDF file
      if (selectedFile.type === 'application/pdf') {
        try {
          const learnerName = profile.user_type === 'parent' 
            ? children?.find(child => child.id === selectedChild)?.name || 'Student'
            : currentChild?.name || 'Student';
          
          console.log('Starting PDF processing for document:', document.id);
          
          // Import the processing service dynamically
          const { processDocument } = await import('@/services/documentProcessingService');
          const result = await processDocument(document.id, selectedFile, learnerName);
          
          if (result.error) {
            console.log('PDF processing completed with issues:', result.error);
            toast({
              title: "Upload successful with note",
              description: `File uploaded successfully, but analysis had issues: ${result.error}`,
              variant: "default",
            });
          } else {
            console.log('PDF processing completed successfully');
          }
        } catch (processingError) {
          console.error('PDF processing failed:', processingError);
          // Don't fail the upload if processing fails
          toast({
            title: "Upload successful",
            description: "File uploaded but content analysis failed. You can still use the document.",
            variant: "default",
          });
        }
      }

      toast({
        title: "Upload successful",
        description: `${selectedFile.name} has been uploaded successfully`,
      });

      // Reset form
      setSelectedFile(null);
      setDocumentType('other');
      setDescription('');
      setSubject('');
      setSelectedChild('');

      // Notify parent component
      onUploadComplete();

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="file">Choose File</Label>
        <FileInput
          id="file"
          onChange={(file) => setSelectedFile(file)}
        />
      </div>

      <div>
        <Label htmlFor="documentType">Document Type</Label>
        <Select onValueChange={value => setDocumentType(value as 'failed_test' | 'study_guide' | 'homework' | 'other')}>
          <SelectTrigger>
            <SelectValue placeholder="Select document type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="failed_test">Failed Test</SelectItem>
            <SelectItem value="study_guide">Study Guide</SelectItem>
            <SelectItem value="homework">Homework</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {profile?.user_type === 'parent' && children && children.length > 0 && (
        <div>
          <Label htmlFor="child">Child</Label>
          <Select onValueChange={setSelectedChild}>
            <SelectTrigger>
              <SelectValue placeholder="Select child" />
            </SelectTrigger>
            <SelectContent>
              {children.map((child) => (
                <SelectItem key={child.id} value={child.id}>
                  {child.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <Label htmlFor="subject">Subject</Label>
        <Select onValueChange={setSubject}>
          <SelectTrigger>
            <SelectValue placeholder="Select subject" />
          </SelectTrigger>
          <SelectContent>
            {subjects.map((subject) => (
              <SelectItem key={subject.id} value={subject.name}>
                {subject.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Document description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <Button type="submit" disabled={uploading || !selectedFile}>
        {uploading ? 'Uploading...' : 'Upload'}
      </Button>
    </form>
  );
};

export default DocumentUpload;
