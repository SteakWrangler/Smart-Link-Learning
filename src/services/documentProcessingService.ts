
import { supabase } from '@/integrations/supabase/client';
import { extractTextFromPDF, analyzeTestContent } from '@/utils/pdfProcessor';
import { DatabaseError, handleError } from '@/utils/errorHandler';
import type { DocumentData } from '@/types/database';

export const processDocument = async (
  documentId: string,
  file: File,
  learnerName: string
): Promise<{ extractedText: string; analysis: any; error?: string }> => {
  try {
    console.log('Starting document processing for:', documentId);
    
    // Extract text from PDF
    const extractedText = await extractTextFromPDF(file);
    console.log('Extracted text length:', extractedText.length);
    console.log('First 200 characters:', extractedText.substring(0, 200));
    
    // Analyze the content if it's a test
    let analysis = null;
    if (file.name.toLowerCase().includes('test') || 
        extractedText.toLowerCase().includes('question') ||
        extractedText.toLowerCase().includes('answer') ||
        extractedText.toLowerCase().includes('math')) {
      analysis = analyzeTestContent(extractedText, learnerName);
      console.log('Generated analysis:', analysis);
    }
    
    // Update the document in the database
    const { error } = await supabase
      .from('documents')
      .update({
        extracted_content: extractedText,
        ai_analysis: analysis,
        processing_status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);
    
    if (error) {
      console.error('Error updating document:', error);
      throw new DatabaseError(
        'Failed to update document after processing',
        'DOCUMENT_UPDATE_ERROR',
        error
      );
    }
    
    console.log('Document processing completed successfully');
    
    return {
      extractedText,
      analysis
    };
  } catch (error) {
    console.error('Error processing document:', error);
    
    // Handle the error through our centralized system
    const appError = handleError(error, 'Document Processing');
    
    // Update the document with error status
    try {
      await supabase
        .from('documents')
        .update({
          processing_status: 'failed',
          processing_error: appError.message,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);
    } catch (updateError) {
      handleError(updateError, 'Document Error Status Update');
    }
    
    // Return partial result with error information
    return {
      extractedText: '',
      analysis: null,
      error: appError.message
    };
  }
};

export const getProcessedDocument = async (documentId: string): Promise<DocumentData | null> => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .maybeSingle(); // Use maybeSingle instead of single to handle no data gracefully
    
    if (error) {
      throw new DatabaseError(
        'Failed to fetch processed document',
        'DOCUMENT_FETCH_ERROR',
        error
      );
    }
    
    return data as DocumentData;
  } catch (error) {
    handleError(error, 'Get Processed Document');
    return null;
  }
};
