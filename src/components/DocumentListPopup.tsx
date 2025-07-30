import React from 'react';
import { X, FileText, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Document {
  id: string;
  fileName: string;
  conversationId?: string;
}

interface DocumentListPopupProps {
  documents: Document[];
  onClose: () => void;
  onDownload?: (document: Document) => void;
  onRemove?: (document: Document) => void;
  title?: string;
}

const DocumentListPopup: React.FC<DocumentListPopupProps> = ({
  documents,
  onClose,
  onDownload,
  onRemove,
  title = "Documents"
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FileText size={20} />
            {title} ({documents.length})
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {documents.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No documents found</p>
          ) : (
            <div className="space-y-3">
              {documents.map((document) => (
                <div key={document.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText size={16} className="text-gray-600 flex-shrink-0" />
                    <span className="text-sm text-gray-800 truncate" title={document.fileName}>
                      {document.fileName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    {onDownload && (
                      <button
                        onClick={() => onDownload(document)}
                        className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                        title="Download document"
                      >
                        <Download size={14} />
                      </button>
                    )}
                    {onRemove && (
                      <button
                        onClick={() => onRemove(document)}
                        className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                        title="Remove document"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 p-4">
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DocumentListPopup;