import { supabase } from '@/integrations/supabase/client';
import { extractTextFromPDF, analyzeTestContent } from '@/utils/pdfProcessor';
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
      throw error;
    }
    
    console.log('Document processing completed successfully');
    
    return {
      extractedText,
      analysis
    };
  } catch (error) {
    console.error('Error processing document:', error);
    
    // Update the document with error status
    const errorMessage = error instanceof Error ? error.message : 'Unknown processing error';
    
    try {
      await supabase
        .from('documents')
        .update({
          processing_status: 'failed',
          processing_error: errorMessage,
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
      error: errorMessage
    };
  }
};

export const getProcessedDocument = async (documentId: string): Promise<DocumentData | null> => {
  try {
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
