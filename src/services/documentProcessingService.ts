
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
    console.log('[DOC-SERVICE-DEBUG] 🚀 Starting document processing...');
    console.log('[DOC-SERVICE-DEBUG] Document ID:', documentId);
    console.log('[DOC-SERVICE-DEBUG] File details:', { name: file.name, size: file.size, type: file.type });
    console.log('[DOC-SERVICE-DEBUG] Learner name:', learnerName);
    
    // Perform security checks for all file types
    console.log('[DOC-SERVICE-DEBUG] 🔒 Performing security checks...');
    const securityError = performFileSecurityChecks(file);
    if (securityError) {
      console.error('[DOC-SERVICE-DEBUG] ❌ Security check failed:', securityError);
      throw new Error(securityError);
    }
    console.log('[DOC-SERVICE-DEBUG] ✅ Security checks passed');

    // All supported files can be processed for text extraction

    // Sanitize learner name input
    console.log('[DOC-SERVICE-DEBUG] 🧹 Sanitizing learner name...');
    const sanitizedLearnerName = sanitizeText(learnerName) || 'Student';
    console.log('[DOC-SERVICE-DEBUG] Sanitized learner name:', sanitizedLearnerName);
    
    // Extract text from file with timeout protection
    console.log('[DOC-SERVICE-DEBUG] 🔥 === STARTING TEXT EXTRACTION ===');
    console.log('[DOC-SERVICE-DEBUG] File type:', file.type);
    console.log('[DOC-SERVICE-DEBUG] File size:', file.size);
    console.log('[DOC-SERVICE-DEBUG] File name:', file.name);
    
    console.log('[DOC-SERVICE-DEBUG] Setting up extraction promise with 30s timeout...');
    const extractionPromise = extractTextFromFile(file);
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        console.error('[DOC-SERVICE-DEBUG] ⏰ Extraction timeout after 30 seconds!');
        reject(new Error('File processing timeout'));
      }, 30000); // 30 second timeout
    });
    
    console.log('[DOC-SERVICE-DEBUG] 🏃 Racing extraction vs timeout...');
    const extractedText = await Promise.race([extractionPromise, timeoutPromise]);
    
    console.log('[DOC-SERVICE-DEBUG] ✅ === TEXT EXTRACTION COMPLETE ===');
    console.log('[DOC-SERVICE-DEBUG] Extracted text length:', extractedText.length);
    console.log('[DOC-SERVICE-DEBUG] First 200 chars:', extractedText.substring(0, 200));
    
    // Sanitize extracted text to prevent any potential issues
    console.log('[DOC-SERVICE-DEBUG] 🧹 Sanitizing extracted text...');
    const sanitizedText = sanitizeText(extractedText);
    console.log('[DOC-SERVICE-DEBUG] Sanitized text length:', sanitizedText.length);
    
    // Limit extracted content size to prevent storage issues
    console.log('[DOC-SERVICE-DEBUG] ✂️ Truncating to 50KB limit...');
    const truncatedText = sanitizedText.substring(0, 50000); // 50KB limit
    console.log('[DOC-SERVICE-DEBUG] Final text length after truncation:', truncatedText.length);
    
    // Analyze the content if it appears to be a test
    console.log('[DOC-SERVICE-DEBUG] 🔍 Checking if content should be analyzed...');
    let analysis = null;
    const shouldAnalyze = file.name.toLowerCase().includes('test') || 
                         truncatedText.toLowerCase().includes('question') ||
                         truncatedText.toLowerCase().includes('answer') ||
                         truncatedText.toLowerCase().includes('math');
    
    console.log('[DOC-SERVICE-DEBUG] Should analyze:', shouldAnalyze);
    
    if (shouldAnalyze) {
      try {
        console.log('[DOC-SERVICE-DEBUG] 📊 Running content analysis...');
        analysis = analyzeTestContent(truncatedText, sanitizedLearnerName);
        console.log('[DOC-SERVICE-DEBUG] ✅ Generated analysis:', analysis);
      } catch (analysisError) {
        console.warn('[DOC-SERVICE-DEBUG] ⚠️ Analysis failed, continuing without analysis:', analysisError);
        // Don't fail the entire process if analysis fails
      }
    } else {
      console.log('[DOC-SERVICE-DEBUG] ⏭️ Skipping analysis (not a test document)');
    }
    
    // Update the document in the database
    console.log('[DOC-SERVICE-DEBUG] 💾 Updating document in database...');
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
      console.error('[DOC-SERVICE-DEBUG] ❌ Error updating document:', error);
      throw error;
    }
    
    console.log('[DOC-SERVICE-DEBUG] ✅ Document processing completed successfully!');
    console.log('[DOC-SERVICE-DEBUG] Final result summary:', {
      documentId,
      textLength: truncatedText.length,
      hasAnalysis: !!analysis
    });
    
    return {
      extractedText: truncatedText,
      analysis
    };
  } catch (error) {
    console.error('[DOC-SERVICE-DEBUG] 💥 === DOCUMENT PROCESSING ERROR ===');
    console.error('[DOC-SERVICE-DEBUG] Error details:', error);
    console.error('[DOC-SERVICE-DEBUG] Error type:', typeof error);
    console.error('[DOC-SERVICE-DEBUG] Error message:', error instanceof Error ? error.message : String(error));
    console.error('[DOC-SERVICE-DEBUG] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('[DOC-SERVICE-DEBUG] Full error object:', error);
    
    // Create safe error message for logging
    console.log('[DOC-SERVICE-DEBUG] 🛡️ Creating safe error message...');
    const safeErrorMessage = createSafeErrorMessage(error);
    console.log('[DOC-SERVICE-DEBUG] Safe error message:', safeErrorMessage);
    
    // Update the document with error status
    try {
      console.log('[DOC-SERVICE-DEBUG] 💾 Updating document with error status...');
      await supabase
        .from('documents')
        .update({
          processing_status: 'failed',
          processing_error: safeErrorMessage,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);
        
      console.log('[DOC-SERVICE-DEBUG] ✅ Updated database with error status');
    } catch (updateError) {
      console.error('[DOC-SERVICE-DEBUG] ❌ Error updating document with error status:', updateError);
    }
    
    // Return partial result with error information
    console.log('[DOC-SERVICE-DEBUG] 🔄 Returning error result');
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
