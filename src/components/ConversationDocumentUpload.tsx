
import React, { useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FileInput } from '@/components/ui/file-input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  sanitizeFileDescription, 
  validateFileType, 
  validateFileSize,
  createSafeErrorMessage,
  checkRateLimit
} from '@/utils/securityUtils';
import type { Tables } from '@/types/supabase';

interface ConversationDocumentUploadProps {
  conversationId: string;
  selectedChild: any;
  onDocumentUploaded: (documents: Tables<'documents'>[]) => void;
  onClose: () => void;
}

// Define allowed file types for security
const ALLOWED_FILE_TYPES = ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_FILES_PER_UPLOAD = 5; // Limit number of files per upload

const ConversationDocumentUpload: React.FC<ConversationDocumentUploadProps> = ({
  conversationId,
  selectedChild,
  onDocumentUploaded,
  onClose
}) => {
  const { profile } = useAuth();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const { toast } = useToast();

  const validateFile = (file: File): string | null => {
    // Validate file type
    if (!validateFileType(file.name, ALLOWED_FILE_TYPES)) {
      return `File type not allowed. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`;
    }

    // Validate file size
    if (!validateFileSize(file.size, MAX_FILE_SIZE)) {
      return `File size too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
    }

    // Additional security checks for PDF files
    if (file.type === 'application/pdf' && file.size < 100) {
      return 'Invalid PDF file detected';
    }

    return null;
  };

  const handleFilesChange = (files: File | File[] | null) => {
    if (!files) {
      setSelectedFiles([]);
      return;
    }

    const fileArray = Array.isArray(files) ? files : [files];
    
    // Limit number of files
    if (fileArray.length > MAX_FILES_PER_UPLOAD) {
      toast({
        title: "Too Many Files",
        description: `Maximum ${MAX_FILES_PER_UPLOAD} files allowed per upload`,
        variant: "destructive",
      });
      return;
    }

    // Validate each file
    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of fileArray) {
      const validationError = validateFile(file);
      if (validationError) {
        errors.push(`${file.name}: ${validationError}`);
      } else {
        validFiles.push(file);
      }
    }

    if (errors.length > 0) {
      toast({
        title: "File Validation Errors",
        description: errors.join('; '),
        variant: "destructive",
      });
    }

    setSelectedFiles(validFiles);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) return;

    // Rate limiting check
    if (!checkRateLimit(`conversation_upload_${profile?.id}`, 3, 60000)) {
      toast({
        title: "Rate Limit Exceeded",
        description: "Too many upload attempts. Please wait a minute before trying again.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    const uploadedDocuments: Tables<'documents'>[] = [];
    const errors: string[] = [];

    try {
      for (const selectedFile of selectedFiles) {
        const fileKey = `${selectedFile.name}-${selectedFiles.indexOf(selectedFile)}`;
        
        try {
          setUploadProgress(prev => ({ ...prev, [fileKey]: 10 }));

          // Final file validation
          const validationError = validateFile(selectedFile);
          if (validationError) {
            throw new Error(validationError);
          }

          // Create unique file path
          const fileExtension = selectedFile.name.split('.').pop();
          const fileName = `${Math.random().toString(36).substring(2)}.${fileExtension}`;
          const filePath = `${profile.id}/${fileName}`;

          setUploadProgress(prev => ({ ...prev, [fileKey]: 30 }));

          // Upload file to Supabase Storage
          const { error: uploadError } = await supabase.storage
            .from('documents')
            .upload(filePath, selectedFile);

          if (uploadError) throw uploadError;

          setUploadProgress(prev => ({ ...prev, [fileKey]: 50 }));

          // Sanitize description input
          const sanitizedDescription = sanitizeFileDescription(description);

          // Create document record
          const documentRecord = {
            user_id: profile.id,
            child_id: profile.user_type === 'parent' ? selectedChild?.id : null,
            file_name: selectedFile.name,
            file_path: filePath,
            file_size: selectedFile.size,
            file_type: selectedFile.type,
            document_type: 'other' as const,
            description: sanitizedDescription || null,
            subject: null,
          };

          const { data: document, error: dbError } = await supabase
            .from('documents')
            .insert(documentRecord)
            .select()
            .single();

          if (dbError) throw dbError;

          setUploadProgress(prev => ({ ...prev, [fileKey]: 70 }));

          // Link document to conversation
          const { error: linkError } = await supabase
            .from('conversation_documents')
            .insert({
              conversation_id: conversationId,
              document_id: document.id
            });

          if (linkError) throw linkError;

          setUploadProgress(prev => ({ ...prev, [fileKey]: 85 }));

          // Process PDF content if it's a PDF file
          if (selectedFile.type === 'application/pdf') {
            try {
              const learnerName = selectedChild?.name || profile.first_name || 'Student';
              
              console.log('Starting PDF processing for conversation document:', document.id);
              
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

          setUploadProgress(prev => ({ ...prev, [fileKey]: 100 }));

          // Create document data object for callback
          const uploadedDocument: Tables<'documents'> = {
            id: document.id,
            user_id: document.user_id,
            child_id: document.child_id,
            file_name: document.file_name,
            file_path: document.file_path,
            file_size: document.file_size,
            file_type: document.file_type,
            document_type: document.document_type,
            description: document.description,
            subject: document.subject,
            extracted_content: document.extracted_content,
            ai_analysis: document.ai_analysis,
            processing_status: document.processing_status,
            processing_error: document.processing_error,
            created_at: document.created_at,
            updated_at: document.updated_at
          };

          uploadedDocuments.push(uploadedDocument);

        } catch (error: any) {
          console.error(`Upload error for ${selectedFile.name}:`, error);
          const safeErrorMessage = createSafeErrorMessage(error);
          errors.push(`${selectedFile.name}: ${safeErrorMessage}`);
        }
      }

      // Show results
      if (uploadedDocuments.length > 0) {
        onDocumentUploaded(uploadedDocuments);
        
        if (errors.length > 0) {
          toast({
            title: "Upload completed with some issues",
            description: `${uploadedDocuments.length} files uploaded successfully. ${errors.length} files failed.`,
            variant: "default",
          });
        } else {
          toast({
            title: "Upload successful",
            description: `${uploadedDocuments.length} file${uploadedDocuments.length > 1 ? 's' : ''} uploaded to this conversation`,
          });
        }
      } else {
        toast({
          title: "Upload failed",
          description: "All files failed to upload. Please try again.",
          variant: "destructive",
        });
      }

      // Reset form and close
      setSelectedFiles([]);
      setDescription('');
      setUploadProgress({});
      onClose();

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
      setUploadProgress({});
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Upload Document to Conversation
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Choose Files (Max {MAX_FILES_PER_UPLOAD} files, {MAX_FILE_SIZE / (1024 * 1024)}MB each)
            </label>
            <FileInput
              multiple={true}
              onChange={handleFilesChange}
            />
            {selectedFiles.length > 0 && (
              <div className="space-y-2 mt-2">
                {selectedFiles.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600 truncate flex-1">
                      {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                    {uploadProgress[`${file.name}-${index}`] !== undefined && (
                      <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress[`${file.name}-${index}`]}%` }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (optional - applies to all files, max 500 characters)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.substring(0, 500))}
              placeholder="What are these documents about?"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {description.length}/500 characters
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || selectedFiles.length === 0}
              className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Uploading {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''}...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Upload {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConversationDocumentUpload;
