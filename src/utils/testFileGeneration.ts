import { fileGenerationService } from '@/services/fileGenerationService';

// Test function to verify file generation works
export const testFileGeneration = async () => {
  try {
    const testContent = `
Math Practice Worksheet

1. Addition Problems:
   a) 5 + 3 = ___
   b) 12 + 8 = ___
   c) 25 + 15 = ___

2. Subtraction Problems:
   a) 10 - 4 = ___
   b) 20 - 7 = ___
   c) 35 - 12 = ___

3. Word Problems:
   a) If you have 8 apples and eat 3, how many do you have left?
   b) A dinosaur is 15 feet tall. If it grows 5 more feet, how tall is it now?

Answers:
1. a) 8, b) 20, c) 40
2. a) 6, b) 13, c) 23
3. a) 5 apples, b) 20 feet
    `;

    const options = {
      title: 'Dinosaur Math Practice',
      content: testContent,
      type: 'worksheet' as const,
      subject: 'Math',
      grade: 'Elementary',
      theme: 'Dinosaur',
      format: 'pdf' as const
    };

    console.log('Testing file generation...');
    const result = await fileGenerationService.generateFile(options);
    
    console.log('File generated successfully!');
    console.log('Filename:', result.filename);
    console.log('File type:', result.type);
    console.log('File size:', result.blob.size, 'bytes');
    
    return result;
  } catch (error) {
    console.error('File generation test failed:', error);
    throw error;
  }
};

// Test detection functions
export const testDetection = () => {
  const testContent = 'Here is a math worksheet with dinosaur-themed problems for practice.';
  
  console.log('Testing content detection...');
  console.log('Content:', testContent);
  console.log('Detected type:', fileGenerationService.detectFileType(testContent));
  console.log('Detected metadata:', fileGenerationService.extractMetadata(testContent));
}; 