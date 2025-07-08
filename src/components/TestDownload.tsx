import React from 'react';
import { 
  testFileGeneration, 
  testTextFileGeneration, 
  testFileGenerationWithoutAnswers, 
  testTextFileGenerationWithoutAnswers,
  testAnswerKeyExtraction,
  testAnswerKeyExtractionDebug
} from '@/utils/testFileGeneration';

const TestDownload: React.FC = () => {
  const handleTestAnswerKeyExtraction = () => {
    try {
      const result = testAnswerKeyExtraction();
      console.log('Answer key extraction test:', result);
      alert('Answer key extraction test completed! Check console for details.');
    } catch (error) {
      console.error('Answer key extraction test failed:', error);
      alert('Answer key extraction test failed: ' + error);
    }
  };

  const handleTestAnswerKeyExtractionDebug = () => {
    try {
      const result = testAnswerKeyExtractionDebug();
      console.log('Answer key extraction debug test:', result);
      alert('Answer key extraction debug test completed! Check console for details.');
    } catch (error) {
      console.error('Answer key extraction debug test failed:', error);
      alert('Answer key extraction debug test failed: ' + error);
    }
  };

  const handleTestPDF = async () => {
    try {
      const result = await testFileGeneration();
      console.log('PDF test successful:', result);
      
      // Create download link
      const url = URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert('PDF test successful! File downloaded.');
    } catch (error) {
      console.error('PDF test failed:', error);
      alert('PDF test failed: ' + error);
    }
  };

  const handleTestPDFWithoutAnswers = async () => {
    try {
      const result = await testFileGenerationWithoutAnswers();
      console.log('PDF test without answers successful:', result);
      
      // Create download link
      const url = URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert('PDF test without answers successful! File downloaded.');
    } catch (error) {
      console.error('PDF test without answers failed:', error);
      alert('PDF test without answers failed: ' + error);
    }
  };

  const handleTestText = async () => {
    try {
      const result = await testTextFileGeneration();
      console.log('Text test successful:', result);
      
      // Create download link
      const url = URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert('Text test successful! File downloaded.');
    } catch (error) {
      console.error('Text test failed:', error);
      alert('Text test failed: ' + error);
    }
  };

  const handleTestTextWithoutAnswers = async () => {
    try {
      const result = await testTextFileGenerationWithoutAnswers();
      console.log('Text test without answers successful:', result);
      
      // Create download link
      const url = URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert('Text test without answers successful! File downloaded.');
    } catch (error) {
      console.error('Text test without answers failed:', error);
      alert('Text test without answers failed: ' + error);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Download Test</h2>
      
      {/* Answer Key Extraction Test */}
      <div className="mb-6">
        <h3 className="font-semibold mb-2">Answer Key Extraction Test</h3>
        <button
          onClick={handleTestAnswerKeyExtraction}
          className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 mb-2"
        >
          Test Answer Key Extraction
        </button>
        <button
          onClick={handleTestAnswerKeyExtractionDebug}
          className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Debug Answer Key Extraction
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <h3 className="font-semibold">PDF Tests</h3>
          <button
            onClick={handleTestPDF}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Test PDF with Answers
          </button>
          <button
            onClick={handleTestPDFWithoutAnswers}
            className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Test PDF without Answers
          </button>
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold">Text Tests</h3>
          <button
            onClick={handleTestText}
            className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Test Text with Answers
          </button>
          <button
            onClick={handleTestTextWithoutAnswers}
            className="w-full px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            Test Text without Answers
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestDownload; 