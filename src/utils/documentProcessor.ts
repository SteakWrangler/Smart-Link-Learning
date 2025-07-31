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

// Extract text from PDF files
export const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    if (file.type !== 'application/pdf') {
      throw new Error('File is not a PDF document');
    }
    
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('PDF file is too large (max 10MB)');
    }
    
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      useSystemFonts: true,
      disableFontFace: false,
      verbosity: 0,
    });
    
    const pdf = await loadingTask.promise;
    let fullText = '';
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        const pageText = textContent.items
          .map((item: any) => {
            if (item.hasEOL) return item.str + '\n';
            return item.str + ' ';
          })
          .join('');
        
        fullText += pageText + '\n\n';
      } catch (pageError) {
        console.error(`Error processing page ${pageNum}:`, pageError);
      }
    }
    
    const cleanText = fullText.trim();
    if (cleanText.length < 10) {
      throw new Error('PDF appears to contain no readable text. It may be a scanned image or an empty document.');
    }
    
    return cleanText;
  } catch (error) {
    console.error('PDF extraction failed:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to extract text from PDF document');
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
  const fileCheck = isFileTypeSupported(file);
  
  if (!fileCheck.supported) {
    throw new Error(fileCheck.message || 'File type not supported');
  }
  
  try {
    switch (file.type) {
      case 'application/pdf':
        return await extractTextFromPDF(file);
      
      case 'text/plain':
        return await extractTextFromTXT(file);
      
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return await extractTextFromDOCX(file);
      
      case 'application/msword':
        return await extractTextFromDOC(file);
      
      default:
        throw new Error(`Unsupported file type: ${file.type}`);
    }
  } catch (error) {
    console.error('Text extraction failed for file:', file.name, error);
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