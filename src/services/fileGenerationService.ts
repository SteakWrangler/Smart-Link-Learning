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
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPosition = margin;
    
    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(options.title, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;
    
    // Metadata
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const metadata = [];
    if (options.subject) metadata.push(`Subject: ${options.subject}`);
    if (options.grade) metadata.push(`Grade: ${options.grade}`);
    if (options.theme) metadata.push(`Theme: ${options.theme}`);
    if (metadata.length > 0) {
      doc.text(metadata.join(' • '), pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;
    }
    
    // Date
    const today = new Date().toLocaleDateString();
    doc.text(`Generated on: ${today}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;
    
    // Content
    doc.setFontSize(12);
    const lines = this.splitTextIntoLines(options.content, pageWidth - (margin * 2), doc);
    for (const line of lines) {
      if (yPosition > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(line, margin, yPosition);
      yPosition += 6;
    }
    
    // Add space for student work if it's a worksheet
    if (options.type === 'worksheet') {
      yPosition += 10;
      doc.setDrawColor(200, 200, 200);
      for (let i = 0; i < 5; i++) {
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 8;
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
    let content = `${options.title}\n`;
    content += '='.repeat(options.title.length) + '\n\n';
    
    const metadata = [];
    if (options.subject) metadata.push(`Subject: ${options.subject}`);
    if (options.grade) metadata.push(`Grade: ${options.grade}`);
    if (options.theme) metadata.push(`Theme: ${options.theme}`);
    if (metadata.length > 0) {
      content += metadata.join(' • ') + '\n';
    }
    
    content += `Generated on: ${new Date().toLocaleDateString()}\n\n`;
    content += options.content;
    
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
   * Extract metadata from AI response
   */
  extractMetadata(content: string): { subject?: string; grade?: string; theme?: string } {
    const metadata: { subject?: string; grade?: string; theme?: string } = {};
    
    // Extract subject
    const subjectPatterns = [
      /math|mathematics/i,
      /reading|literacy/i,
      /science/i,
      /history|social studies/i,
      /english|language arts/i
    ];
    
    for (const pattern of subjectPatterns) {
      if (pattern.test(content)) {
        metadata.subject = content.match(pattern)?.[0] || '';
        break;
      }
    }
    
    // Extract theme
    const themePatterns = [
      /dinosaur|dinosaurs/i,
      /space|astronaut|planet/i,
      /ocean|underwater|marine/i,
      /animal|animals/i,
      /robot|robots/i,
      /superhero|superheroes/i
    ];
    
    for (const pattern of themePatterns) {
      if (pattern.test(content)) {
        metadata.theme = content.match(pattern)?.[0] || '';
        break;
      }
    }
    
    return metadata;
  }
}

export const fileGenerationService = new FileGenerationService(); 