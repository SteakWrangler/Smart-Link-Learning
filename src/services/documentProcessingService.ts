
import { supabase } from '@/integrations/supabase/client';
import { extractTextFromPDF, analyzeTestContent } from '@/utils/pdfProcessor';
import { sanitizeText, createSafeErrorMessage } from '@/utils/securityUtils';
import type { DocumentData } from '@/types/database';

// Additional PDF security checks
const performPDFSecurityChecks = (file: File): string | null => {
  // Check file size (basic DoS prevention)
  if (file.size > 100 * 1024 * 1024) { // 100MB limit for PDFs
    return 'PDF file too large for processing';
  }

  // Check for minimum viable PDF size
  if (file.size < 100) {
    return 'Invalid PDF file detected';
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
    console.log('Starting document processing for:', documentId);
    
    // Perform security checks for PDF files
    if (file.type === 'application/pdf') {
      const securityError = performPDFSecurityChecks(file);
      if (securityError) {
        throw new Error(securityError);
      }
    }

    // Sanitize learner name input
    const sanitizedLearnerName = sanitizeText(learnerName) || 'Student';
    
    // Extract text from PDF with timeout protection
    const extractionPromise = extractTextFromPDF(file);
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('PDF processing timeout')), 30000); // 30 second timeout
    });
    
    const extractedText = await Promise.race([extractionPromise, timeoutPromise]);
    
    console.log('Extracted text length:', extractedText.length);
    console.log('First 200 characters:', extractedText.substring(0, 200));
    
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
    console.error('Error processing document:', error);
    
    // Create safe error message for logging
    const safeErrorMessage = createSafeErrorMessage(error);
    
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
