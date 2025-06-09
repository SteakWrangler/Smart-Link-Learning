
import { supabase } from '@/integrations/supabase/client';
import { extractTextFromPDF, analyzeTestContent } from '@/utils/pdfProcessor';
import type { DocumentData } from '@/types/database';

export const processDocument = async (
  documentId: string,
  file: File,
  learnerName: string
): Promise<{ extractedText: string; analysis: any }> => {
  try {
    console.log('Starting document processing for:', documentId);
    
    // Extract text from PDF
    const extractedText = await extractTextFromPDF(file);
    console.log('Extracted text:', extractedText.substring(0, 200) + '...');
    
    // Analyze the content if it's a test
    let analysis = null;
    if (file.name.toLowerCase().includes('test') || extractedText.toLowerCase().includes('question')) {
      analysis = analyzeTestContent(extractedText, learnerName);
      console.log('Generated analysis:', analysis);
    }
    
    // Update the document in the database
    const { error } = await supabase
      .from('documents')
      .update({
        extracted_content: extractedText,
        ai_analysis: analysis,
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
    throw error;
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
