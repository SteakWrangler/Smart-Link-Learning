import React from 'react';
import TestDownload from '@/components/TestDownload';

const TestDownloadPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Download Test Page</h1>
        <TestDownload />
      </div>
    </div>
  );
};

export default TestDownloadPage; 