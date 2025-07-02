import React, { useState } from 'react';
import { Download, ChevronDown, FileText, FileDown, Settings } from 'lucide-react';
import { fileGenerationService, FileGenerationOptions } from '@/services/fileGenerationService';
import { useToast } from '@/hooks/use-toast';

interface DownloadOptionsProps {
  content: string;
  title?: string;
  type?: 'worksheet' | 'practice-test' | 'activity' | 'summary' | 'custom';
  subject?: string;
  grade?: string;
  theme?: string;
  className?: string;
}

const DownloadOptions: React.FC<DownloadOptionsProps> = ({
  content,
  title,
  type,
  subject,
  grade,
  theme,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'txt'>('pdf');
  const [includeAnswers, setIncludeAnswers] = useState(false);
  const { toast } = useToast();

  const handleDownload = async (format: 'pdf' | 'txt') => {
    if (!content.trim()) {
      toast({
        title: "No content",
        description: "There's no content to download.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Auto-detect type and metadata if not provided
      const detectedType = type || fileGenerationService.detectFileType(content);
      const detectedMetadata = fileGenerationService.extractMetadata(content);
      
      const options: FileGenerationOptions = {
        title: title || `Generated ${detectedType.replace('-', ' ')}`,
        content: content,
        type: detectedType,
        subject: subject || detectedMetadata.subject,
        grade: grade || detectedMetadata.grade,
        theme: theme || detectedMetadata.theme,
        includeAnswers: includeAnswers,
        format: format
      };

      const generatedFile = await fileGenerationService.generateFile(options);

      // Create download link
      const url = URL.createObjectURL(generatedFile.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = generatedFile.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Download successful!",
        description: `Your ${detectedType.replace('-', ' ')} has been downloaded as ${format.toUpperCase()}.`,
      });

      setIsOpen(false);

    } catch (error) {
      console.error('Error generating file:', error);
      toast({
        title: "Download failed",
        description: "There was an error generating your file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const detectedType = type || fileGenerationService.detectFileType(content);
  const detectedMetadata = fileGenerationService.extractMetadata(content);

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isGenerating || !content.trim()}
        className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Download options"
      >
        {isGenerating ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        ) : (
          <Download size={16} />
        )}
        <span>{isGenerating ? 'Generating...' : 'Download'}</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Download Options</h3>
            
            {/* Format Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                File Format
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="format"
                    value="pdf"
                    checked={selectedFormat === 'pdf'}
                    onChange={(e) => setSelectedFormat(e.target.value as 'pdf' | 'txt')}
                    className="text-blue-500"
                  />
                  <FileText size={16} className="text-red-500" />
                  <span className="text-sm">PDF Document</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="format"
                    value="txt"
                    checked={selectedFormat === 'txt'}
                    onChange={(e) => setSelectedFormat(e.target.value as 'pdf' | 'txt')}
                    className="text-blue-500"
                  />
                  <FileDown size={16} className="text-blue-500" />
                  <span className="text-sm">Text File</span>
                </label>
              </div>
            </div>

            {/* Additional Options */}
            {(detectedType === 'practice-test' || detectedType === 'worksheet') && (
              <div className="mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeAnswers}
                    onChange={(e) => setIncludeAnswers(e.target.checked)}
                    className="text-blue-500"
                  />
                  <span className="text-sm">Include answer key (if available)</span>
                </label>
              </div>
            )}

            {/* File Info */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-600">
                <div><strong>Type:</strong> {detectedType.replace('-', ' ')}</div>
                {detectedMetadata.subject && (
                  <div><strong>Subject:</strong> {detectedMetadata.subject}</div>
                )}
                {detectedMetadata.theme && (
                  <div><strong>Theme:</strong> {detectedMetadata.theme}</div>
                )}
              </div>
            </div>

            {/* Download Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => handleDownload(selectedFormat)}
                disabled={isGenerating}
                className="flex-1 bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                Download {selectedFormat.toUpperCase()}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="px-3 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default DownloadOptions; 