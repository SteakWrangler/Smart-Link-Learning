import * as pdfjsLib from 'pdfjs-dist';

// Configure the worker with fallback options for better compatibility
if (typeof window !== 'undefined') {
  // Try to use the bundled worker first, fall back to CDN
  try {
    console.log('[PDF-DEBUG] Attempting to configure PDF.js worker with bundled version...');
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.js',
      import.meta.url
    ).toString();
    console.log('[PDF-DEBUG] ✅ Successfully configured bundled worker:', pdfjsLib.GlobalWorkerOptions.workerSrc);
  } catch (error) {
    // Fallback to CDN if bundled worker fails
    console.log('[PDF-DEBUG] ❌ Bundled worker failed, falling back to CDN:', error);
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
    console.log('[PDF-DEBUG] ✅ Using CDN worker:', pdfjsLib.GlobalWorkerOptions.workerSrc);
  }
} else {
  console.log('[PDF-DEBUG] Running in non-browser environment, skipping worker configuration');
}

interface PDFProcessingResult {
  extractedText: string;
  analysis: any;
}

// Fallback PDF processing using pdf-parse (server-side compatible)
const extractTextWithPdfParse = async (file: File): Promise<string> => {
  try {
    console.log('[PDF-DEBUG] 🔄 Trying fallback PDF extraction method (pdf-parse)...');
    console.log('[PDF-DEBUG] File info for fallback:', { name: file.name, size: file.size, type: file.type });
    
    // Dynamic import of pdf-parse for client-side compatibility
    console.log('[PDF-DEBUG] Importing pdf-parse library...');
    const pdfParse = await import('pdf-parse');
    console.log('[PDF-DEBUG] ✅ pdf-parse library imported successfully');
    
    console.log('[PDF-DEBUG] Converting file to array buffer...');
    const buffer = await file.arrayBuffer();
    console.log('[PDF-DEBUG] ✅ Array buffer created, size:', buffer.byteLength);
    
    console.log('[PDF-DEBUG] Processing with pdf-parse...');
    const data = await pdfParse.default(buffer);
    console.log('[PDF-DEBUG] ✅ PDF-parse extraction successful!');
    console.log('[PDF-DEBUG] Extracted text length:', data.text.length);
    console.log('[PDF-DEBUG] First 200 chars:', data.text.substring(0, 200));
    
    return data.text;
  } catch (error) {
    console.error('[PDF-DEBUG] ❌ PDF-parse fallback failed:', error);
    console.error('[PDF-DEBUG] Error type:', typeof error);
    console.error('[PDF-DEBUG] Error message:', error instanceof Error ? error.message : String(error));
    throw error;
  }
};

export const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    console.log('[PDF-DEBUG] 🚀 Starting PDF text extraction...');
    console.log('[PDF-DEBUG] File details:', { name: file.name, size: file.size, type: file.type });
    
    // Validate file type
    console.log('[PDF-DEBUG] Validating file type...');
    if (file.type !== 'application/pdf') {
      console.error('[PDF-DEBUG] ❌ Invalid file type:', file.type);
      throw new Error('File is not a PDF document');
    }
    console.log('[PDF-DEBUG] ✅ File type validation passed');
    
    // Validate file size (max 10MB)
    console.log('[PDF-DEBUG] Validating file size...');
    if (file.size > 10 * 1024 * 1024) {
      console.error('[PDF-DEBUG] ❌ File too large:', file.size, 'bytes');
      throw new Error('PDF file is too large (max 10MB)');
    }
    console.log('[PDF-DEBUG] ✅ File size validation passed:', file.size, 'bytes');
    
    // Convert file to array buffer
    console.log('[PDF-DEBUG] Converting file to array buffer...');
    const arrayBuffer = await file.arrayBuffer();
    console.log('[PDF-DEBUG] ✅ Array buffer created, size:', arrayBuffer.byteLength);
    
    // Load the PDF document with additional options
    console.log('[PDF-DEBUG] Loading PDF document with PDF.js...');
    console.log('[PDF-DEBUG] PDF.js worker source:', pdfjsLib.GlobalWorkerOptions.workerSrc);
    
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      useSystemFonts: true,
      disableFontFace: false,
      verbosity: 0, // Reduce console noise
    });
    
    console.log('[PDF-DEBUG] PDF loading task created, awaiting promise...');
    const pdf = await loadingTask.promise;
    console.log('[PDF-DEBUG] ✅ PDF loaded successfully!');
    console.log('[PDF-DEBUG] PDF info:', { pages: pdf.numPages });
    
    let fullText = '';
    let processedPages = 0;
    
    console.log('[PDF-DEBUG] 🔄 Starting page-by-page text extraction...');
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        console.log(`[PDF-DEBUG] Processing page ${pageNum}/${pdf.numPages}...`);
        
        const page = await pdf.getPage(pageNum);
        console.log(`[PDF-DEBUG] ✅ Page ${pageNum} loaded successfully`);
        
        const textContent = await page.getTextContent();
        console.log(`[PDF-DEBUG] ✅ Text content extracted from page ${pageNum}`, {
          itemsCount: textContent.items.length
        });
        
        // Log first few items for debugging
        if (textContent.items.length > 0) {
          console.log(`[PDF-DEBUG] Sample text items from page ${pageNum}:`, 
            textContent.items.slice(0, 3).map((item: any) => ({
              str: item.str,
              hasEOL: item.hasEOL,
              transform: item.transform
            }))
          );
        }
        
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
        
        console.log(`[PDF-DEBUG] ✅ Page ${pageNum} processed successfully, text length: ${pageText.length}`);
        console.log(`[PDF-DEBUG] First 100 chars from page ${pageNum}:`, pageText.substring(0, 100));
      } catch (pageError) {
        console.error(`[PDF-DEBUG] ❌ Error processing page ${pageNum}:`, pageError);
        console.error(`[PDF-DEBUG] Page error type:`, typeof pageError);
        console.error(`[PDF-DEBUG] Page error message:`, pageError instanceof Error ? pageError.message : String(pageError));
        // Continue with other pages even if one fails
      }
    }
    
    console.log('[PDF-DEBUG] 🏁 Page extraction complete!');
    console.log('[PDF-DEBUG] Final results:', {
      processedPages: processedPages,
      totalPages: pdf.numPages,
      successRate: `${processedPages}/${pdf.numPages}`,
      totalTextLength: fullText.length
    });
    console.log('[PDF-DEBUG] First 200 characters of extracted text:', fullText.substring(0, 200));
    
    // Check if we actually extracted any meaningful text
    const cleanText = fullText.trim();
    console.log('[PDF-DEBUG] Cleaned text length:', cleanText.length);
    
    if (cleanText.length < 10) {
      console.error('[PDF-DEBUG] ❌ Insufficient text extracted (< 10 chars)');
      console.error('[PDF-DEBUG] This will trigger "scanned image" error');
      console.error('[PDF-DEBUG] Raw extracted text:', JSON.stringify(fullText));
      throw new Error('PDF appears to contain no readable text. It may be a scanned image or an empty document.');
    }
    
    console.log('[PDF-DEBUG] ✅ PDF.js extraction successful! Returning cleaned text.');
    return cleanText;
  } catch (error) {
    console.error('[PDF-DEBUG] ❌ PDF.js extraction failed!');
    console.error('[PDF-DEBUG] Error type:', typeof error);
    console.error('[PDF-DEBUG] Error message:', error instanceof Error ? error.message : String(error));
    console.error('[PDF-DEBUG] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('[PDF-DEBUG] Full error object:', error);
    
    // Try fallback method with pdf-parse
    try {
      console.log('[PDF-DEBUG] 🔄 Attempting fallback extraction method...');
      const fallbackText = await extractTextWithPdfParse(file);
      
      console.log('[PDF-DEBUG] Checking fallback text length...');
      if (fallbackText.trim().length < 10) {
        console.error('[PDF-DEBUG] ❌ Fallback also returned insufficient text (< 10 chars)');
        console.error('[PDF-DEBUG] Fallback text:', JSON.stringify(fallbackText));
        throw new Error('PDF appears to contain no readable text. It may be a scanned image or an empty document.');
      }
      
      console.log('[PDF-DEBUG] ✅ Fallback extraction successful! Returning fallback text.');
      return fallbackText.trim();
    } catch (fallbackError) {
      console.error('[PDF-DEBUG] ❌ Fallback extraction also failed!');
      console.error('[PDF-DEBUG] Fallback error type:', typeof fallbackError);
      console.error('[PDF-DEBUG] Fallback error message:', fallbackError instanceof Error ? fallbackError.message : String(fallbackError));
      console.error('[PDF-DEBUG] Fallback error object:', fallbackError);
    }
    
    // Provide more specific error messages
    console.log('[PDF-DEBUG] 🔍 Analyzing error for specific error message...');
    if (error instanceof Error) {
      if (error.message.includes('Invalid PDF')) {
        console.log('[PDF-DEBUG] Detected invalid PDF error');
        throw new Error('The uploaded file is not a valid PDF document');
      } else if (error.message.includes('Password')) {
        console.log('[PDF-DEBUG] Detected password protected PDF error');
        throw new Error('PDF is password protected. Please upload an unprotected version');
      } else if (error.message.includes('network')) {
        console.log('[PDF-DEBUG] Detected network error');
        throw new Error('Network error while processing PDF. Please check your connection and try again');
      } else if (error.message.includes('no readable text')) {
        console.log('[PDF-DEBUG] Detected no readable text error');
        throw new Error('PDF contains no readable text. It may be a scanned image - try uploading a text-based PDF instead');
      }
      console.log('[PDF-DEBUG] No specific error pattern matched, re-throwing original error');
      throw error;
    }
    
    console.log('[PDF-DEBUG] Error is not an Error instance, throwing generic message');
    throw new Error('Failed to extract text from PDF. Please ensure the file is a valid, text-based PDF document');
  }
};

export const analyzeTestContent = (extractedText: string, learnerName: string): any => {
  console.log('Starting analysis of extracted text...');
  
  // Simple analysis of the test content
  const lines = extractedText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const incorrectAnswers = [];
  const correctAnswers = [];
  let totalQuestions = 0;
  
  // Look for various question patterns
  const questionPatterns = [
    /question\s*\d+/i,
    /\d+\.\s/,
    /what\s+is/i,
    /how\s+many/i,
    /if\s+you/i
  ];
  
  // Look for answer patterns
  const answerPatterns = [
    /answer[:\s]+(.+)/i,
    /^[a-d]\)\s*(.+)/i,
    /^\d+\s*$/
  ];
  
  let currentQuestion = '';
  let questionNumber = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if this line contains a question
    const isQuestion = questionPatterns.some(pattern => pattern.test(line));
    
    if (isQuestion) {
      questionNumber++;
      currentQuestion = line;
      totalQuestions++;
      
      // Look ahead for answers
      let j = i + 1;
      let studentAnswer = '';
      let correctAnswer = '';
      
      while (j < lines.length && j < i + 5) { // Look at next 5 lines
        const nextLine = lines[j];
        
        if (nextLine.toLowerCase().includes('student') || nextLine.toLowerCase().includes('your')) {
          studentAnswer = nextLine.replace(/student.*?:?\s*/i, '').replace(/your.*?:?\s*/i, '').trim();
        }
        
        if (nextLine.toLowerCase().includes('correct') || nextLine.toLowerCase().includes('answer')) {
          correctAnswer = nextLine.replace(/correct.*?:?\s*/i, '').replace(/answer.*?:?\s*/i, '').trim();
        }
        
        j++;
      }
      
      // If we found both answers, determine if correct
      if (studentAnswer && correctAnswer) {
        const isCorrect = studentAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim() ||
                         correctAnswer.includes('✓') ||
                         (studentAnswer.includes(correctAnswer) && correctAnswer.length > 2);
        
        if (isCorrect) {
          correctAnswers.push({
            question: currentQuestion,
            studentAnswer,
            correctAnswer: correctAnswer.replace('✓', '').trim()
          });
        } else {
          incorrectAnswers.push({
            question: currentQuestion,
            studentAnswer,
            correctAnswer: correctAnswer.replace('✓', '').trim()
          });
        }
      }
    }
  }
  
  // If we couldn't parse structured Q&A, try to infer from the text
  if (totalQuestions === 0) {
    // Count math expressions or question marks
    const mathExpressions = extractedText.match(/\d+\s*[+\-×÷]\s*\d+/g) || [];
    const questionMarks = extractedText.match(/\?/g) || [];
    totalQuestions = Math.max(mathExpressions.length, questionMarks.length);
    
    // Estimate some incorrect answers for demo purposes
    if (totalQuestions > 0) {
      const estimatedIncorrect = Math.floor(totalQuestions * 0.3); // Assume 30% incorrect
      for (let i = 0; i < estimatedIncorrect; i++) {
        incorrectAnswers.push({
          question: `Math problem ${i + 1}`,
          studentAnswer: 'Unknown',
          correctAnswer: 'Unknown'
        });
      }
      
      for (let i = 0; i < totalQuestions - estimatedIncorrect; i++) {
        correctAnswers.push({
          question: `Math problem ${estimatedIncorrect + i + 1}`,
          studentAnswer: 'Correct',
          correctAnswer: 'Correct'
        });
      }
    }
  }
  
  // Identify problem areas based on content
  const problemAreas = [];
  const textLower = extractedText.toLowerCase();
  
  if (textLower.includes('+') || textLower.includes('add') || textLower.includes('sum')) {
    problemAreas.push('addition');
  }
  if (textLower.includes('-') || textLower.includes('subtract') || textLower.includes('minus')) {
    problemAreas.push('subtraction');
  }
  if (textLower.includes('×') || textLower.includes('*') || textLower.includes('multiply') || textLower.includes('times')) {
    problemAreas.push('multiplication');
  }
  if (textLower.includes('÷') || textLower.includes('/') || textLower.includes('divide')) {
    problemAreas.push('division');
  }
  if (textLower.includes('fraction') || textLower.includes('½') || textLower.includes('¼')) {
    problemAreas.push('fractions');
  }
  
  const analysis = {
    learnerName,
    totalQuestions: Math.max(totalQuestions, correctAnswers.length + incorrectAnswers.length),
    correctAnswers: correctAnswers.length,
    incorrectAnswers: incorrectAnswers.length,
    accuracy: totalQuestions > 0 ? Math.round((correctAnswers.length / totalQuestions) * 100) : 0,
    problemAreas: [...new Set(problemAreas)],
    detailedResults: {
      correct: correctAnswers,
      incorrect: incorrectAnswers
    },
    recommendations: generateRecommendations(problemAreas, incorrectAnswers),
    rawTextLength: extractedText.length
  };
  
  console.log('Analysis complete:', analysis);
  return analysis;
};

const generateRecommendations = (problemAreas: string[], incorrectAnswers: any[]): string[] => {
  const recommendations = [];
  
  if (problemAreas.includes('addition')) {
    recommendations.push('Practice basic addition with regrouping/carrying');
  }
  if (problemAreas.includes('subtraction')) {
    recommendations.push('Work on subtraction with borrowing');
  }
  if (problemAreas.includes('multiplication')) {
    recommendations.push('Review multiplication tables and word problems');
  }
  if (problemAreas.includes('division')) {
    recommendations.push('Practice division facts and remainders');
  }
  if (problemAreas.includes('fractions')) {
    recommendations.push('Work on fraction basics and equivalents');
  }
  
  return recommendations;
};
