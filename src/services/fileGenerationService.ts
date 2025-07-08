import { jsPDF } from 'jspdf';

export interface FileGenerationOptions {
  title: string;
  content: string;
  type: 'worksheet' | 'practice-test' | 'activity' | 'summary' | 'custom';
  subject?: string;
  grade?: string;
  theme?: string;
  includeAnswers?: boolean;
  format?: 'pdf' | 'txt';
  answerKey?: string;
}

export interface GeneratedFile {
  blob: Blob;
  filename: string;
  type: string;
}

class FileGenerationService {
  /**
   * Generate a downloadable file from AI conversation content
   */
  async generateFile(options: FileGenerationOptions): Promise<GeneratedFile> {
    switch (options.format || 'pdf') {
      case 'pdf':
        return this.generatePDF(options);
      case 'txt':
        return this.generateTextFile(options);
      default:
        throw new Error(`Unsupported format: ${options.format}`);
    }
  }

  /**
   * Generate a PDF file
   */
  private async generatePDF(options: FileGenerationOptions): Promise<GeneratedFile> {
    // Create PDF with better configuration
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true,
      floatPrecision: 16
    });
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;
    
    // Header - use the exact title as provided, don't modify it
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    // Ensure proper capitalization of the title
    const capitalizedTitle = options.title.replace(/\b\w/g, l => l.toUpperCase());
    const titleLines = this.splitTextIntoLines(capitalizedTitle, pageWidth - (margin * 2), doc);
    for (const line of titleLines) {
      if (yPosition > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(line, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10; // Increased spacing
    }
    yPosition += 15; // More space after title
    
    // Content - preserve original formatting exactly
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    // Process content based on includeAnswers option
    let processedContent = options.content;
    if (!options.includeAnswers) {
      // Remove answer key section if not requested
      const { mainContent } = this.extractAnswerKey(options.content);
      processedContent = mainContent;
    }
    
    // Clean content formatting for document generation
    processedContent = this.cleanContentForDocument(processedContent);
    
    // Split content into lines and handle each line properly
    const lines = processedContent.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const nextLine = lines[i + 1];
      
      // Check if we need a new page
      if (yPosition > pageHeight - margin - 20) {
        doc.addPage();
        yPosition = margin;
      }
      
      if (line.trim() === '') {
        // Empty line - add spacing
        yPosition += 8;
        continue;
      }
      
      // Handle different line types
      if (line.trim().startsWith('**') && line.trim().endsWith('**')) {
        // Bold header
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        const headerText = line.replace(/\*\*/g, '').trim();
        const headerLines = this.splitTextIntoLines(headerText, pageWidth - (margin * 2), doc);
        for (const headerLine of headerLines) {
          if (yPosition > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
          }
          doc.text(headerLine, margin, yPosition);
          yPosition += 10;
        }
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        yPosition += 8; // Extra space after header
      } else if (line.trim().startsWith('Answer Key:') || line.trim().startsWith('Answers:')) {
        // Answer key section - only include if requested
        if (options.includeAnswers) {
          yPosition += 12; // Extra space before answer key
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(12);
          if (yPosition > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
          }
          doc.text('Answer Key:', margin, yPosition);
          yPosition += 10;
          doc.setFont('helvetica', 'normal');
          
          // Process the answer key content
          const answerText = line.replace(/^(Answer Key:|Answers:)/, '').trim();
          if (answerText) {
            const answerLines = this.splitTextIntoLines(answerText, pageWidth - (margin * 2), doc);
            for (const answerLine of answerLines) {
              if (yPosition > pageHeight - margin) {
                doc.addPage();
                yPosition = margin;
              }
              doc.text(answerLine, margin, yPosition);
              yPosition += 8;
            }
          }
        }
        // If includeAnswers is false, skip this line entirely
      } else if (line.trim().match(/^\d+\./)) {
        // Numbered question
        const questionLines = this.splitTextIntoLines(line, pageWidth - (margin * 2), doc);
        for (const questionLine of questionLines) {
          if (yPosition > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
          }
          doc.text(questionLine, margin, yPosition);
          yPosition += 8;
        }
        yPosition += 4; // Extra space after question
      } else {
        // Regular text line
        const textLines = this.splitTextIntoLines(line, pageWidth - (margin * 2), doc);
        for (const textLine of textLines) {
          if (yPosition > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
          }
          doc.text(textLine, margin, yPosition);
          yPosition += 8;
        }
        yPosition += 2; // Small space between lines
      }
    }
    
    // Add space for student work if it's a worksheet
    if (options.type === 'worksheet') {
      yPosition += 15;
      doc.setDrawColor(200, 200, 200);
      for (let i = 0; i < 5; i++) {
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 10; // More space between lines
      }
    }
    
    const filename = this.generateFilename(options);
    const pdfBlob = doc.output('blob');
    
    return {
      blob: pdfBlob,
      filename: filename,
      type: 'application/pdf'
    };
  }

  /**
   * Generate a text file
   */
  private async generateTextFile(options: FileGenerationOptions): Promise<GeneratedFile> {
    // Ensure proper capitalization of the title
    const capitalizedTitle = options.title.replace(/\b\w/g, l => l.toUpperCase());
    let content = `${capitalizedTitle}\n`;
    content += '='.repeat(capitalizedTitle.length) + '\n\n';
    
    // Process content based on includeAnswers option
    let processedContent = options.content;
    if (!options.includeAnswers) {
      // Remove answer key section if not requested
      const { mainContent } = this.extractAnswerKey(options.content);
      processedContent = mainContent;
    }
    
    // Clean content formatting for document generation
    processedContent = this.cleanContentForDocument(processedContent);
    
    // Process content with proper spacing
    const lines = processedContent.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const nextLine = lines[i + 1];
      
      if (line.trim() === '') {
        content += '\n'; // Preserve empty lines
        continue;
      }
      
      // Handle different line types
      if (line.trim().startsWith('**') && line.trim().endsWith('**')) {
        // Bold header - add extra spacing
        content += '\n' + line + '\n\n';
      } else if (line.trim().startsWith('Answer Key:') || line.trim().startsWith('Answers:')) {
        // Answer key section - only include if requested
        if (options.includeAnswers) {
          content += '\n' + line + '\n';
        }
        // If includeAnswers is false, skip this line entirely
      } else if (line.trim().match(/^\d+\./)) {
        // Numbered question - add spacing
        content += line + '\n\n';
      } else {
        // Regular text line
        content += line + '\n';
      }
    }
    
    const blob = new Blob([content], { type: 'text/plain' });
    const filename = this.generateFilename(options).replace('.pdf', '.txt');
    
    return {
      blob: blob,
      filename: filename,
      type: 'text/plain'
    };
  }

  /**
   * Split text into lines that fit the page width
   */
  private splitTextIntoLines(text: string, maxWidth: number, doc: jsPDF): string[] {
    if (!text || text.trim() === '') {
      return [];
    }
    
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = doc.getTextWidth(testLine);
      
      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  }

  /**
   * Generate a filename for the file
   */
  private generateFilename(options: FileGenerationOptions): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const type = options.type.replace('-', '_');
    const subject = options.subject ? `_${options.subject.toLowerCase().replace(/\s+/g, '_')}` : '';
    const theme = options.theme ? `_${options.theme.toLowerCase().replace(/\s+/g, '_')}` : '';
    
    return `${type}${subject}${theme}_${timestamp}.pdf`;
  }

  /**
   * Detect file type from AI response content
   */
  detectFileType(content: string): FileGenerationOptions['type'] {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('worksheet') || lowerContent.includes('practice problems')) {
      return 'worksheet';
    }
    
    if (lowerContent.includes('test') || lowerContent.includes('quiz')) {
      return 'practice-test';
    }
    
    if (lowerContent.includes('activity') || lowerContent.includes('game')) {
      return 'activity';
    }
    
    if (lowerContent.includes('summary') || lowerContent.includes('review')) {
      return 'summary';
    }
    
    return 'custom';
  }

  /**
   * Extract metadata from AI response - only extract if explicitly mentioned
   */
  extractMetadata(content: string): { subject?: string; grade?: string; theme?: string } {
    const metadata: { subject?: string; grade?: string; theme?: string } = {};
    
    // Only extract subject if it's explicitly mentioned in the content
    const subjectPatterns = [
      /subject:\s*(math|mathematics|reading|literacy|science|history|social studies|english|language arts)/i,
      /math|mathematics/i,
      /reading|literacy/i,
      /science/i,
      /history|social studies/i,
      /english|language arts/i
    ];
    
    for (const pattern of subjectPatterns) {
      const match = content.match(pattern);
      if (match) {
        // Only use the subject if it appears in a meaningful context
        const subject = match[1] || match[0];
        // Check if it's part of a structured format or meaningful context
        if (content.includes(`Subject: ${subject}`) || 
            content.includes(`${subject} worksheet`) ||
            content.includes(`${subject} practice`) ||
            content.includes(`${subject} test`)) {
          metadata.subject = subject;
          break;
        }
      }
    }
    
    // Only extract theme if it's explicitly mentioned in the content and in a meaningful way
    const themePatterns = [
      /theme:\s*(dinosaur|dinosaurs|space|astronaut|planet|ocean|underwater|marine|animal|animals|robot|robots|superhero|superheroes)/i,
      /dinosaur|dinosaurs/i,
      /space|astronaut|planet/i,
      /ocean|underwater|marine/i,
      /animal|animals/i,
      /robot|robots/i,
      /superhero|superheroes/i
    ];
    
    for (const pattern of themePatterns) {
      const match = content.match(pattern);
      if (match) {
        const theme = match[1] || match[0];
        // Only use the theme if it appears in a meaningful context
        if (content.includes(`${theme} theme`) ||
            content.includes(`${theme} worksheet`) ||
            content.includes(`${theme} practice`) ||
            content.includes(`${theme} activity`) ||
            content.includes(`${theme} test`)) {
          metadata.theme = theme;
          break;
        }
      }
    }
    
    return metadata;
  }

  /**
   * Extract answer key from content
   */
  extractAnswerKey(content: string): { mainContent: string; answerKey?: string } {
    // Prefer marker-based extraction
    const startMarker = '[ANSWER_KEY_START]';
    const endMarker = '[ANSWER_KEY_END]';
    const startIdx = content.indexOf(startMarker);
    const endIdx = content.indexOf(endMarker);
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      const mainContent = content.slice(0, startIdx).trim();
      const answerKey = content.slice(startIdx + startMarker.length, endIdx).trim();
      return { mainContent, answerKey };
    }
    // Fallback to old logic for legacy content
    // Look for answer key sections with better detection
    const answerKeyPatterns = [
      /answer\s+key:?\s*\n/i,
      /answers:?\s*\n/i,
      /answer\s+sheet:?\s*\n/i,
      /solutions:?\s*\n/i,
      /key:?\s*\n/i
    ];
    for (const pattern of answerKeyPatterns) {
      const match = content.match(pattern);
      if (match) {
        const index = content.indexOf(match[0]);
        const mainContent = content.substring(0, index).trim();
        const answerKey = content.substring(index + match[0].length).trim();
        return { mainContent, answerKey };
      }
    }
    // If no explicit answer key section, look for numbered answers
    const lines = content.split('\n');
    let answerKeyStartIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.match(/^(answer\s+key|answers|answer\s+sheet|solutions|key):?$/i)) {
        answerKeyStartIndex = i;
        break;
      }
      if (line.match(/^\d+\.\s*[^:]*:\s*[^\n]*$/)) {
        let isAnswerSection = false;
        for (let j = Math.max(0, i - 3); j < i; j++) {
          const prevLine = lines[j].trim();
          if (prevLine.match(/^(answer\s+key|answers|answer\s+sheet|solutions|key):?$/i)) {
            isAnswerSection = true;
            answerKeyStartIndex = j;
            break;
          }
        }
        if (isAnswerSection) {
          break;
        }
      }
    }
    if (answerKeyStartIndex !== -1) {
      const mainContent = lines.slice(0, answerKeyStartIndex).join('\n').trim();
      const answerKey = lines.slice(answerKeyStartIndex).join('\n').trim();
      return { mainContent, answerKey };
    }
    // If no answer key section found, return the full content
    return { mainContent: content };
  }

  /**
   * Clean content formatting for document generation
   * Removes emojis, decorative symbols, and chat-specific formatting
   */
  private cleanContentForDocument(content: string): string {
    return content
      // Remove emojis and decorative symbols
      .replace(/[🎯🧮📚📊🎯📄📥]/g, '')
      .replace(/[🌟✨💫⭐]/g, '')
      .replace(/[🔍🔎📋📝]/g, '')
      .replace(/[🎮🎲🎪🎨]/g, '')
      .replace(/[🚀🛸🌌🌍]/g, '')
      .replace(/[🦕🦖🦴🏛️]/g, '')
      .replace(/[🍕🍕🍕🍕🍕]/g, '')
      .replace(/[🔬🧪⚗️🧬]/g, '')
      .replace(/[📖📚📝✏️]/g, '')
      .replace(/[🏀⚽🏈🎾]/g, '')
      .replace(/[👨‍🍳👩‍🍳🍳🍽️]/g, '')
      .replace(/[👨‍🚀👩‍🚀🚀🛸]/g, '')
      .replace(/[👨‍🔬👩‍🔬🔬🧬]/g, '')
      .replace(/[👨‍🏫👩‍🏫📚✏️]/g, '')
      
      // Remove decorative dashes and lines that are used for visual separation in chat
      .replace(/^-{3,}$/gm, '') // Remove lines of dashes
      .replace(/^_{3,}$/gm, '') // Remove lines of underscores
      .replace(/^={3,}$/gm, '') // Remove lines of equals
      .replace(/^\*{3,}$/gm, '') // Remove lines of asterisks
      
      // Clean up excessive spacing
      .replace(/\n{4,}/g, '\n\n') // Replace 4+ newlines with 2
      .replace(/^\s*\n/gm, '\n') // Remove empty lines with just spaces
      
      // Remove chat-specific formatting that doesn't work in documents
      .replace(/^\[.*?\]\s*/gm, '') // Remove bracketed labels like [ANSWER_KEY_START]
      .replace(/^\(.*?\)\s*/gm, '') // Remove parenthetical labels
      
      // Clean up bullet points and numbering
      .replace(/^[•◦▪▫]\s*/gm, '• ') // Standardize bullet points
      .replace(/^[#]\s*/gm, '') // Remove pound symbols used as bullets
      .replace(/^[#]{2,}\s*/gm, '') // Remove multiple pound symbols
      
      // Clean up section headers
      .replace(/^\*\*(.*?)\*\*$/gm, '$1') // Remove markdown bold formatting
      .replace(/^__(.*?)__$/gm, '$1') // Remove markdown underline formatting
      
      // Remove excessive punctuation that's decorative
      .replace(/!{2,}/g, '!') // Reduce multiple exclamation marks
      .replace(/\?{2,}/g, '?') // Reduce multiple question marks
      
      // Clean up spacing around punctuation
      .replace(/\s+([.!?])/g, '$1') // Remove spaces before punctuation
      .replace(/([.!?])\s+/g, '$1 ') // Ensure space after punctuation
      
      // Remove descriptive text about grade levels, subjects, and focus areas
      .replace(/early elementary\s+math\s+practice\s+tests?\s+with\s+a\s+focus\s+on\s+[^.]*\.?/gi, '')
      .replace(/elementary\s+math\s+practice\s+tests?\s+with\s+a\s+focus\s+on\s+[^.]*\.?/gi, '')
      .replace(/middle school\s+math\s+practice\s+tests?\s+with\s+a\s+focus\s+on\s+[^.]*\.?/gi, '')
      .replace(/high school\s+math\s+practice\s+tests?\s+with\s+a\s+focus\s+on\s+[^.]*\.?/gi, '')
      .replace(/practice\s+tests?\s+with\s+a\s+focus\s+on\s+[^.]*\.?/gi, '')
      .replace(/worksheets?\s+with\s+a\s+focus\s+on\s+[^.]*\.?/gi, '')
      .replace(/activities?\s+with\s+a\s+focus\s+on\s+[^.]*\.?/gi, '')
      
      // Remove encouraging phrases that are chat-specific
      .replace(/great job working on these problems!?/gi, '')
      .replace(/keep up the great work!?/gi, '')
      .replace(/you're doing amazing!?/gi, '')
      .replace(/way to go!?/gi, '')
      
      // Final cleanup
      .trim();
  }
}

export const fileGenerationService = new FileGenerationService(); 