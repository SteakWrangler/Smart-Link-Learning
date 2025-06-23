
import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FileInput } from '@/components/ui/file-input';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Upload, FileText } from 'lucide-react';
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
  const [uploadProgress, setUploadProgress] = useState(0);
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

  const validateFile = (file: File): string | null => {
    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return 'File size must be less than 10MB';
    }

    // Check file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      return 'File type not supported. Please upload PDF, image, or document files.';
    }

    return null;
  };

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

    // Validate file
    const validationError = validateFile(selectedFile);
    if (validationError) {
      toast({
        title: "Invalid file",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Create unique file path with user ID folder structure
      const fileExtension = selectedFile.name.split('.').pop();
      const timestamp = Date.now();
      const fileName = `${timestamp}_${Math.random().toString(36).substring(2)}.${fileExtension}`;
      const filePath = `${profile.id}/${fileName}`;

      console.log('Starting file upload to:', filePath);
      setUploadProgress(25);

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }

      console.log('File uploaded successfully:', uploadData);
      setUploadProgress(50);

      // Get the public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      console.log('Public URL generated:', publicUrl);
      setUploadProgress(75);

      // Create document record in database
      const documentData = {
        user_id: profile.id,
        child_id: profile.user_type === 'parent' ? selectedChild || null : currentChild?.id || null,
        file_name: selectedFile.name,
        file_path: filePath,
        file_size: selectedFile.size,
        file_type: selectedFile.type,
        document_type: documentType,
        description: description || null,
        subject: subject || null,
        processing_status: 'pending' as const
      };

      const { data: document, error: dbError } = await supabase
        .from('documents')
        .insert(documentData)
        .select()
        .single();

      if (dbError) {
        console.error('Database insert error:', dbError);
        throw dbError;
      }

      console.log('Document record created:', document);
      setUploadProgress(90);

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
          } else {
            console.log('PDF processing completed successfully');
          }
        } catch (processingError) {
          console.error('PDF processing failed:', processingError);
          // Don't fail the upload if processing fails
        }
      }

      setUploadProgress(100);

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
      setUploadProgress(0);

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
      setUploadProgress(0);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Progress */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 animate-pulse" />
            <span className="text-sm font-medium">Uploading...</span>
          </div>
          <Progress value={uploadProgress} className="w-full" />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="file">Choose File</Label>
          <FileInput
            id="file"
            onChange={(file) => setSelectedFile(file)}
            disabled={uploading}
          />
          {selectedFile && (
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
              <FileText className="h-4 w-4" />
              <span>{selectedFile.name}</span>
              <span>({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="documentType">Document Type</Label>
          <Select 
            onValueChange={value => setDocumentType(value as 'failed_test' | 'study_guide' | 'homework' | 'other')}
            disabled={uploading}
          >
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
            <Select onValueChange={setSelectedChild} disabled={uploading}>
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
          <Select onValueChange={setSubject} disabled={uploading}>
            <SelectTrigger>
              <SelectValue placeholder="Select subject (optional)" />
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
            placeholder="Document description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={uploading}
          />
        </div>

        <Button type="submit" disabled={uploading || !selectedFile} className="w-full">
          {uploading ? (
            <>
              <Upload className="mr-2 h-4 w-4 animate-spin" />
              Uploading... {uploadProgress}%
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload Document
            </>
          )}
        </Button>
      </form>
    </div>
  );
};

export default DocumentUpload;
