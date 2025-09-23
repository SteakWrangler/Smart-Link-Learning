import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.js',
      import.meta.url
    ).toString();
  } catch {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
  }
}

// Only supported file types that can be processed for text extraction
export const SUPPORTED_FILE_TYPES = {
  'text/plain': { extension: 'txt', displayName: 'Text files' },
  'application/pdf': { extension: 'pdf', displayName: 'PDF documents' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { 
    extension: 'docx', displayName: 'Word documents (newer)' 
  },
  'application/msword': { extension: 'doc', displayName: 'Word documents (older)' },
};

export const getSupportedFileTypes = () => {
  return Object.entries(SUPPORTED_FILE_TYPES)
    .map(([mimeType, config]) => ({ mimeType, ...config }));
};

export const isFileTypeSupported = (file: File): { supported: boolean; message?: string } => {
  const fileType = SUPPORTED_FILE_TYPES[file.type as keyof typeof SUPPORTED_FILE_TYPES];
  
  if (!fileType) {
    // Check by file extension as fallback
    const extension = file.name.split('.').pop()?.toLowerCase();
    const typeByExtension = Object.values(SUPPORTED_FILE_TYPES).find(type => type.extension === extension);
    
    if (!typeByExtension) {
      const supportedExtensions = Object.values(SUPPORTED_FILE_TYPES).map(type => `.${type.extension}`).join(', ');
      return {
        supported: false,
        message: `File type not supported. Supported formats: ${supportedExtensions}`
      };
    }
    
    return {
      supported: true
    };
  }
  
  return {
    supported: true
  };
};

// Fallback PDF processing using pdf-parse (server-side compatible)
const extractTextWithPdfParse = async (file: File): Promise<string> => {
  try {
    console.log('Trying fallback PDF extraction method...');
    
    // Dynamic import of pdf-parse for client-side compatibility
    const pdfParse = await import('pdf-parse');
    const buffer = await file.arrayBuffer();
    const data = await pdfParse.default(buffer);
    
    console.log('PDF-parse extraction successful, text length:', data.text.length);
    return data.text;
  } catch (error) {
    console.error('PDF-parse fallback failed:', error);
    throw error;
  }
};

// Extract text from PDF files
export const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    console.log('[DOC-PROCESSOR-DEBUG] 🚀 documentProcessor.ts: Starting PDF extraction...');
    console.log('[DOC-PROCESSOR-DEBUG] File details:', { name: file.name, size: file.size, type: file.type });
    
    if (file.type !== 'application/pdf') {
      console.error('[DOC-PROCESSOR-DEBUG] ❌ Invalid file type:', file.type);
      throw new Error('File is not a PDF document');
    }
    
    if (file.size > 10 * 1024 * 1024) {
      console.error('[DOC-PROCESSOR-DEBUG] ❌ File too large:', file.size);
      throw new Error('PDF file is too large (max 10MB)');
    }
    
    console.log('[DOC-PROCESSOR-DEBUG] ✅ Initial validation passed, proceeding to PDF.js extraction...');
    
    // Convert file to array buffer
    const arrayBuffer = await file.arrayBuffer();
    console.log('File converted to array buffer, size:', arrayBuffer.byteLength);
    
    // Load the PDF document with additional options
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      useSystemFonts: true,
      disableFontFace: false,
      verbosity: 0, // Reduce console noise
    });
    
    const pdf = await loadingTask.promise;
    console.log('PDF loaded successfully, pages:', pdf.numPages);
    
    let fullText = '';
    let processedPages = 0;
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Combine all text items from the page with better spacing
        const pageText = textContent.items
          .map((item: any) => {
            // Add spacing based on transform matrix if available
            if (item.hasEOL) return item.str + '\n';
            return item.str + ' ';
          })
          .join('');
        
        fullText += pageText + '\n\n';
        processedPages++;
        
        console.log(`Page ${pageNum} processed, text length: ${pageText.length}`);
      } catch (pageError) {
        console.error(`Error processing page ${pageNum}:`, pageError);
        // Continue with other pages even if one fails
      }
    }
    
    console.log(`Extraction complete. Processed ${processedPages}/${pdf.numPages} pages`);
    console.log('Total extracted text length:', fullText.length);
    console.log('First 200 characters:', fullText.substring(0, 200));
    
    // Check if we actually extracted any meaningful text
    const cleanText = fullText.trim();
    if (cleanText.length < 10) {
      throw new Error('PDF appears to contain no readable text. It may be a scanned image or an empty document.');
    }
    
    return cleanText;
  } catch (error) {
    console.error('PDF.js extraction failed:', error);
    
    // Try fallback method with pdf-parse
    try {
      console.log('Attempting fallback extraction method...');
      const fallbackText = await extractTextWithPdfParse(file);
      
      if (fallbackText.trim().length < 10) {
        throw new Error('PDF appears to contain no readable text. It may be a scanned image or an empty document.');
      }
      
      console.log('Fallback extraction successful!');
      return fallbackText.trim();
    } catch (fallbackError) {
      console.error('Fallback extraction also failed:', fallbackError);
    }
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Invalid PDF')) {
        throw new Error('The uploaded file is not a valid PDF document');
      } else if (error.message.includes('Password')) {
        throw new Error('PDF is password protected. Please upload an unprotected version');
      } else if (error.message.includes('network')) {
        throw new Error('Network error while processing PDF. Please check your connection and try again');
      } else if (error.message.includes('no readable text')) {
        throw new Error('PDF contains no readable text. It may be a scanned image - try uploading a text-based PDF instead');
      }
      throw error;
    }
    
    throw new Error('Failed to extract text from PDF. Please ensure the file is a valid, text-based PDF document');
  }
};

// Extract text from .txt files
export const extractTextFromTXT = async (file: File): Promise<string> => {
  try {
    if (file.type !== 'text/plain') {
      throw new Error('File is not a text document');
    }
    
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Text file is too large (max 5MB)');
    }
    
    const text = await file.text();
    
    if (text.trim().length < 1) {
      throw new Error('Text file appears to be empty');
    }
    
    return text.trim();
  } catch (error) {
    console.error('Text extraction failed:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to extract text from text file');
  }
};

// Extract text from .docx files using mammoth
export const extractTextFromDOCX = async (file: File): Promise<string> => {
  try {
    if (file.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      throw new Error('File is not a DOCX document');
    }
    
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('DOCX file is too large (max 10MB)');
    }
    
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    if (result.value.trim().length < 1) {
      throw new Error('DOCX file appears to contain no readable text');
    }
    
    // Log any warnings from mammoth
    if (result.messages.length > 0) {
      console.warn('DOCX processing warnings:', result.messages);
    }
    
    return result.value.trim();
  } catch (error) {
    console.error('DOCX extraction failed:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to extract text from DOCX document');
  }
};

// Extract text from .doc files (older Word format)
export const extractTextFromDOC = async (file: File): Promise<string> => {
  try {
    if (file.type !== 'application/msword') {
      throw new Error('File is not a DOC document');
    }
    
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('DOC file is too large (max 10MB)');
    }
    
    // For older .doc files, mammoth can still try to extract text
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    if (result.value.trim().length < 1) {
      throw new Error('DOC file appears to contain no readable text or may be corrupted');
    }
    
    if (result.messages.length > 0) {
      console.warn('DOC processing warnings:', result.messages);
    }
    
    return result.value.trim();
  } catch (error) {
    console.error('DOC extraction failed:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to extract text from DOC document. This format may not be fully supported.');
  }
};

// Main function to extract text from any supported file type
export const extractTextFromFile = async (file: File): Promise<string> => {
  console.log('[DOC-PROCESSOR-DEBUG] 🎯 Main extractTextFromFile called');
  console.log('[DOC-PROCESSOR-DEBUG] File info:', { name: file.name, size: file.size, type: file.type });
  
  const fileCheck = isFileTypeSupported(file);
  console.log('[DOC-PROCESSOR-DEBUG] File type support check:', fileCheck);
  
  if (!fileCheck.supported) {
    console.error('[DOC-PROCESSOR-DEBUG] ❌ File type not supported');
    throw new Error(fileCheck.message || 'File type not supported');
  }
  
  try {
    console.log('[DOC-PROCESSOR-DEBUG] 🔄 Routing to appropriate extraction method...');
    
    switch (file.type) {
      case 'application/pdf':
        console.log('[DOC-PROCESSOR-DEBUG] 📄 Routing to PDF extraction');
        return await extractTextFromPDF(file);
      
      case 'text/plain':
        console.log('[DOC-PROCESSOR-DEBUG] 📝 Routing to TXT extraction');
        return await extractTextFromTXT(file);
      
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        console.log('[DOC-PROCESSOR-DEBUG] 📄 Routing to DOCX extraction');
        return await extractTextFromDOCX(file);
      
      case 'application/msword':
        console.log('[DOC-PROCESSOR-DEBUG] 📄 Routing to DOC extraction');
        return await extractTextFromDOC(file);
      
      default:
        console.error('[DOC-PROCESSOR-DEBUG] ❌ Unsupported file type in switch:', file.type);
        throw new Error(`Unsupported file type: ${file.type}`);
    }
  } catch (error) {
    console.error('[DOC-PROCESSOR-DEBUG] ❌ Text extraction failed for file:', file.name);
    console.error('[DOC-PROCESSOR-DEBUG] Error type:', typeof error);
    console.error('[DOC-PROCESSOR-DEBUG] Error message:', error instanceof Error ? error.message : String(error));
    console.error('[DOC-PROCESSOR-DEBUG] Full error:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to extract text from file');
  }
};

// Get user-friendly error message for file validation
export const getFileValidationMessage = (file: File): string | null => {
  const fileCheck = isFileTypeSupported(file);
  
  if (!fileCheck.supported) {
    return fileCheck.message || 'File type not supported';
  }
  
  // Check file size limits
  const maxSizes: { [key: string]: number } = {
    'application/pdf': 10 * 1024 * 1024, // 10MB
    'text/plain': 5 * 1024 * 1024, // 5MB
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 10 * 1024 * 1024, // 10MB
    'application/msword': 10 * 1024 * 1024, // 10MB
  };
  
  const maxSize = maxSizes[file.type];
  if (maxSize && file.size > maxSize) {
    return `File too large. Maximum size for ${SUPPORTED_FILE_TYPES[file.type as keyof typeof SUPPORTED_FILE_TYPES]?.displayName}: ${Math.round(maxSize / (1024 * 1024))}MB`;
  }
  
  return null;
};