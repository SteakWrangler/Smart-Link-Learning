import React, { useState } from 'react';
import { Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import { fileGenerationService } from '@/services/fileGenerationService';

interface DownloadableContentProps {
  content: string;
  className?: string;
}

const DownloadableContent: React.FC<DownloadableContentProps> = ({
  content,
  className = ''
}) => {
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  
  // Extract answer key from content
  const { mainContent, answerKey } = fileGenerationService.extractAnswerKey(content);
  
  // Debug logging
  console.log('DownloadableContent Debug:');
  console.log('Original content:', content);
  console.log('Main content:', mainContent);
  console.log('Answer key:', answerKey);
  console.log('Has answer key:', !!answerKey);
  
  // If no answer key found, just display the content as is
  if (!answerKey) {
    return (
      <div className={`whitespace-pre-wrap text-sm sm:text-base break-words ${className}`}>
        {content}
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Main content - only show the main content, not the full content */}
      <div className="whitespace-pre-wrap text-sm sm:text-base break-words">
        {mainContent}
      </div>
      
      {/* Answer key section */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={() => setShowAnswerKey(!showAnswerKey)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          {showAnswerKey ? (
            <>
              <EyeOff size={16} />
              <span className="text-sm font-medium">Hide Answer Key</span>
              <ChevronUp size={14} />
            </>
          ) : (
            <>
              <Eye size={16} />
              <span className="text-sm font-medium">Show Answer Key</span>
              <ChevronDown size={14} />
            </>
          )}
        </button>
        
        {showAnswerKey && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-xs text-yellow-700 font-medium mb-2">Answer Key</div>
            <div className="whitespace-pre-wrap text-sm text-gray-800">
              {answerKey}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DownloadableContent; 