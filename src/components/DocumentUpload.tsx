
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
import { 
  sanitizeFileDescription, 
  createSafeErrorMessage,
  checkRateLimit
} from '@/utils/securityUtils';
import { 
  isFileTypeSupported, 
  getFileValidationMessage, 
  getSupportedFileTypes
} from '@/utils/documentProcessor';
import type { Child, Subject } from '@/types/database';

interface DocumentUploadProps {
  children?: Child[];
  subjects: Subject[];
  onUploadComplete: () => void;
}

// Get supported file types from the document processor
const SUPPORTED_FILE_TYPES = getSupportedFileTypes();

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

  const validateFile = (file: File): string | null => {
    return getFileValidationMessage(file);
  };

  const handleFileChange = (file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      return;
    }

    const validationError = validateFile(file);
    if (validationError) {
      toast({
        title: "File Validation Error",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
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

    // Rate limiting check
    if (!checkRateLimit(`upload_${profile.id}`, 5, 60000)) {
      toast({
        title: "Rate Limit Exceeded",
        description: "Too many upload attempts. Please wait a minute before trying again.",
        variant: "destructive",
      });
      return;
    }

    // Final file validation
    const validationError = validateFile(selectedFile);
    if (validationError) {
      toast({
        title: "File Validation Error",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    // Check if file type is supported
    const fileCheck = isFileTypeSupported(selectedFile);
    if (!fileCheck.supported) {
      toast({
        title: "Unsupported File Type",
        description: fileCheck.message || "This file type is not supported for upload.",
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

      // Sanitize description input
      const sanitizedDescription = sanitizeFileDescription(description);

      // Create document record
      const documentData = {
        user_id: profile.id,
        child_id: profile.user_type === 'parent' ? selectedChild : null,
        file_name: selectedFile.name,
        file_path: filePath,
        file_size: selectedFile.size,
        file_type: selectedFile.type,
        document_type: documentType,
        description: sanitizedDescription || null,
        subject: subject || null,
      };

      const { data: document, error: dbError } = await supabase
        .from('documents')
        .insert(documentData)
        .select()
        .single();

      if (dbError) throw dbError;

      // Process document content for all supported files
      try {
        const learnerName = profile.user_type === 'parent' 
          ? children?.find(child => child.id === selectedChild)?.name || 'Student'
          : profile.first_name || 'Student';
        
        console.log('Starting document processing for:', document.id, 'File type:', selectedFile.type);
        
        // Import the processing service dynamically
        const { processDocument } = await import('@/services/documentProcessingService');
        const result = await processDocument(document.id, selectedFile, learnerName);
        
        if (result.error) {
          console.log('Document processing completed with issues:', result.error);
          toast({
            title: "Upload successful with note",
            description: "File uploaded successfully, but content analysis had issues.",
            variant: "default",
          });
        } else {
          console.log('Document processing completed successfully');
        }
      } catch (processingError) {
        console.error('Document processing failed:', processingError);
        // Don't fail the upload if processing fails
        toast({
          title: "Upload successful",
          description: "File uploaded but content analysis failed. You can still use the document.",
          variant: "default",
        });
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
      const safeErrorMessage = createSafeErrorMessage(error);
      toast({
        title: "Upload failed",
        description: safeErrorMessage,
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
          onChange={handleFileChange}
        />
        
        {/* File type information */}
        <div className="mt-2 text-sm">
          <div className="text-green-600 mb-2">
            <strong>✅ Supported file types:</strong>
            <ul className="ml-4 mt-1">
              {SUPPORTED_FILE_TYPES.map((type) => (
                <li key={type.extension} className="text-xs">
                  • .{type.extension} - {type.displayName}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="text-red-600">
            <strong>❌ Unsupported file types:</strong>
            <p className="text-xs mt-1 ml-4">
              Images (.jpg, .png, .gif), videos (.mp4), audio files (.mp3), archives (.zip), and other formats are not supported.
            </p>
          </div>
        </div>
        
        {selectedFile && (
          <div className="mt-2">
            <p className="text-sm text-gray-600">
              Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
            {(() => {
              const fileCheck = isFileTypeSupported(selectedFile);
              if (fileCheck.supported) {
                return <p className="text-xs text-green-600">✅ This file type is supported and will be processed</p>;
              } else {
                return <p className="text-xs text-red-600">❌ This file type is not supported</p>;
              }
            })()}
          </div>
        )}
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
          placeholder="Document description (max 500 characters)"
          value={description}
          onChange={(e) => setDescription(e.target.value.substring(0, 500))}
          maxLength={500}
        />
        <p className="text-xs text-gray-500 mt-1">
          {description.length}/500 characters
        </p>
      </div>

      <Button type="submit" disabled={uploading || !selectedFile}>
        {uploading ? 'Uploading...' : 'Upload'}
      </Button>
    </form>
  );
};

export default DocumentUpload;
