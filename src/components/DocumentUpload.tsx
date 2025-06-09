
import React, { useState } from 'react';
import { Upload, File, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { processDocument } from '@/services/documentProcessingService';
import type { Child, StudentProfile, Subject } from '@/types/database';

interface DocumentUploadProps {
  children?: Child[];
  studentProfile?: StudentProfile | null;
  subjects: Subject[];
  onUploadComplete: () => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  children = [],
  studentProfile,
  subjects,
  onUploadComplete
}) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [documentType, setDocumentType] = useState<string>('');
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 10MB",
          variant: "destructive",
        });
        return;
      }

      // Check file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please select an image, PDF, or document file",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !documentType || !profile) {
      toast({
        title: "Missing information",
        description: "Please select a file and document type",
        variant: "destructive",
      });
      return;
    }

    if (profile.user_type === 'parent' && !selectedChild) {
      toast({
        title: "Missing child selection",
        description: "Please select which child this document is for",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Create file path with user folder structure
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${profile.id}/${fileName}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Insert document metadata into database
      const documentData = {
        user_id: profile.id,
        child_id: profile.user_type === 'parent' ? selectedChild : null,
        student_profile_id: profile.user_type === 'student' ? studentProfile?.id : null,
        file_name: selectedFile.name,
        file_path: filePath,
        file_size: selectedFile.size,
        file_type: selectedFile.type,
        document_type: documentType,
        description: description || null,
        subject: subject || null,
      };

      const { data: insertedDoc, error: dbError } = await supabase
        .from('documents')
        .insert(documentData)
        .select()
        .single();

      if (dbError) throw dbError;

      toast({
        title: "Upload successful",
        description: "Your document has been uploaded successfully",
      });

      // Process PDF content if it's a PDF file
      if (selectedFile.type === 'application/pdf' && insertedDoc) {
        setProcessing(true);
        
        try {
          const learnerName = profile.user_type === 'parent' 
            ? children.find(child => child.id === selectedChild)?.name || 'Student'
            : studentProfile?.name || 'Student';
            
          await processDocument(insertedDoc.id, selectedFile, learnerName);
          
          toast({
            title: "Document processed",
            description: "PDF content has been extracted and analyzed",
          });
        } catch (processError) {
          console.error('Processing error:', processError);
          toast({
            title: "Processing warning",
            description: "Document uploaded but content analysis failed",
            variant: "destructive",
          });
        } finally {
          setProcessing(false);
        }
      }

      // Reset form
      setSelectedFile(null);
      setDocumentType('');
      setSelectedChild('');
      setSubject('');
      setDescription('');
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

  const removeFile = () => {
    setSelectedFile(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload size={24} />
          Upload Document
          {processing && (
            <span className="text-sm text-blue-600 ml-2">Processing...</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="file-upload">Select Document</Label>
          <div className="mt-2">
            {!selectedFile ? (
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-4 text-gray-500" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PDF, DOC, DOCX, TXT, or images (MAX. 10MB)</p>
                </div>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                />
              </label>
            ) : (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <File size={16} />
                  <span className="text-sm text-gray-700">{selectedFile.name}</span>
                  <span className="text-xs text-gray-500">
                    ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeFile}
                  className="text-gray-500 hover:text-red-500"
                >
                  <X size={16} />
                </Button>
              </div>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="document-type">Document Type</Label>
          <Select value={documentType} onValueChange={setDocumentType}>
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

        {profile?.user_type === 'parent' && children.length > 0 && (
          <div>
            <Label htmlFor="child-select">Select Child</Label>
            <Select value={selectedChild} onValueChange={setSelectedChild}>
              <SelectTrigger>
                <SelectValue placeholder="Select child" />
              </SelectTrigger>
              <SelectContent>
                {children.map(child => (
                  <SelectItem key={child.id} value={child.id}>
                    {child.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <Label htmlFor="subject">Subject (Optional)</Label>
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger>
              <SelectValue placeholder="Select subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map(subj => (
                <SelectItem key={subj.id} value={subj.name}>
                  {subj.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description of this document..."
            rows={3}
          />
        </div>

        <Button
          onClick={handleUpload}
          disabled={!selectedFile || !documentType || uploading || processing}
          className="w-full"
        >
          {uploading ? 'Uploading...' : processing ? 'Processing...' : 'Upload Document'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default DocumentUpload;
