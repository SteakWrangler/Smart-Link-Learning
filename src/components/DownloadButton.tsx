import React, { useState } from 'react';
import { Download, FileText, FileDown, Loader2 } from 'lucide-react';
import { fileGenerationService, FileGenerationOptions } from '@/services/fileGenerationService';
import { useToast } from '@/hooks/use-toast';

interface DownloadButtonProps {
  content: string;
  title?: string;
  type?: 'worksheet' | 'practice-test' | 'activity' | 'summary' | 'custom';
  subject?: string;
  grade?: string;
  theme?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const DownloadButton: React.FC<DownloadButtonProps> = ({
  content,
  title,
  type,
  subject,
  grade,
  theme,
  className = '',
  variant = 'default',
  size = 'md'
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
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
        format: 'pdf'
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
        description: `Your ${detectedType.replace('-', ' ')} has been downloaded.`,
      });

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

  const getVariantClasses = () => {
    switch (variant) {
      case 'outline':
        return 'border border-gray-300 text-gray-700 hover:bg-gray-50';
      case 'ghost':
        return 'text-gray-600 hover:bg-gray-100';
      default:
        return 'bg-blue-500 text-white hover:bg-blue-600';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'lg':
        return 'px-6 py-3 text-lg';
      default:
        return 'px-4 py-2 text-base';
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isGenerating || !content.trim()}
      className={`
        flex items-center gap-2 rounded-lg font-medium transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        ${getVariantClasses()}
        ${getSizeClasses()}
        ${className}
      `}
      title="Download as PDF"
    >
      {isGenerating ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <Download size={16} />
      )}
      {isGenerating ? 'Generating...' : 'Download PDF'}
    </button>
  );
};

export default DownloadButton; 