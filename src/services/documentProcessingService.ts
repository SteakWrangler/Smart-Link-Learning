
import { supabase } from '@/integrations/supabase/client';
import { extractTextFromFile, isFileTypeSupported } from '@/utils/documentProcessor';
import { analyzeTestContent } from '@/utils/pdfProcessor';
import { sanitizeText, createSafeErrorMessage } from '@/utils/securityUtils';
import type { DocumentData } from '@/types/database';

// Enhanced file security checks for all supported types
const performFileSecurityChecks = (file: File): string | null => {
  // Check if file type is supported
  const fileCheck = isFileTypeSupported(file);
  if (!fileCheck.supported) {
    return fileCheck.message || 'File type not supported';
  }

  // Check file size limits based on type
  const maxSizes: { [key: string]: number } = {
    'application/pdf': 100 * 1024 * 1024, // 100MB for PDFs
    'text/plain': 5 * 1024 * 1024, // 5MB for text files
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 50 * 1024 * 1024, // 50MB for DOCX
    'application/msword': 50 * 1024 * 1024, // 50MB for DOC
  };
  
  const maxSize = maxSizes[file.type] || 10 * 1024 * 1024; // Default 10MB
  if (file.size > maxSize) {
    return `File too large for processing. Maximum size: ${Math.round(maxSize / (1024 * 1024))}MB`;
  }

  // Check for minimum viable file size
  if (file.size < 10) {
    return 'Invalid or empty file detected';
  }

  // Basic filename validation
  if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
    return 'Invalid filename detected';
  }

  return null;
};

export const processDocument = async (
  documentId: string,
  file: File,
  learnerName: string
): Promise<{ extractedText: string; analysis: any; error?: string }> => {
  try {
    console.log('Starting document processing for:', documentId, 'File type:', file.type);
    
    // Perform security checks for all file types
    const securityError = performFileSecurityChecks(file);
    if (securityError) {
      throw new Error(securityError);
    }

    // All supported files can be processed for text extraction

    // Sanitize learner name input
    const sanitizedLearnerName = sanitizeText(learnerName) || 'Student';
    
    // Extract text from file with timeout protection
    console.log('=== STARTING TEXT EXTRACTION ===');
    console.log('File type:', file.type);
    console.log('File size:', file.size);
    console.log('File name:', file.name);
    
    const extractionPromise = extractTextFromFile(file);
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('File processing timeout')), 30000); // 30 second timeout
    });
    
    const extractedText = await Promise.race([extractionPromise, timeoutPromise]);
    
    console.log('=== TEXT EXTRACTION COMPLETE ===');
    console.log('Extracted text length:', extractedText.length);
    console.log('First 200 chars:', extractedText.substring(0, 200));
    
    // Sanitize extracted text to prevent any potential issues
    const sanitizedText = sanitizeText(extractedText);
    
    // Limit extracted content size to prevent storage issues
    const truncatedText = sanitizedText.substring(0, 50000); // 50KB limit
    
    // Analyze the content if it appears to be a test
    let analysis = null;
    if (file.name.toLowerCase().includes('test') || 
        truncatedText.toLowerCase().includes('question') ||
        truncatedText.toLowerCase().includes('answer') ||
        truncatedText.toLowerCase().includes('math')) {
      
      try {
        analysis = analyzeTestContent(truncatedText, sanitizedLearnerName);
        console.log('Generated analysis:', analysis);
      } catch (analysisError) {
        console.warn('Analysis failed, continuing without analysis:', analysisError);
        // Don't fail the entire process if analysis fails
      }
    }
    
    // Update the document in the database
    const { error } = await supabase
      .from('documents')
      .update({
        extracted_content: truncatedText,
        ai_analysis: analysis,
        processing_status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);
    
    if (error) {
      console.error('Error updating document:', error);
      throw error;
    }
    
    console.log('Document processing completed successfully');
    
    return {
      extractedText: truncatedText,
      analysis
    };
  } catch (error) {
    console.error('=== DOCUMENT PROCESSING ERROR ===');
    console.error('Error details:', error);
    console.error('Error type:', typeof error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Create safe error message for logging
    const safeErrorMessage = createSafeErrorMessage(error);
    console.log('Safe error message:', safeErrorMessage);
    
    // Update the document with error status
    try {
      await supabase
        .from('documents')
        .update({
          processing_status: 'failed',
          processing_error: safeErrorMessage,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);
        
      console.log('Updated database with error status');
    } catch (updateError) {
      console.error('Error updating document with error status:', updateError);
    }
    
    // Return partial result with error information
    return {
      extractedText: '',
      analysis: null,
      error: safeErrorMessage
    };
  }
};

export const getProcessedDocument = async (documentId: string): Promise<DocumentData | null> => {
  try {
    // Input validation
    if (!documentId || typeof documentId !== 'string') {
      console.error('Invalid document ID provided');
      return null;
    }

    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();
    
    if (error) {
      console.error('Error fetching processed document:', error);
      return null;
    }
    
    return data as DocumentData;
  } catch (error) {
    console.error('Error in getProcessedDocument:', error);
    return null;
  }
};
