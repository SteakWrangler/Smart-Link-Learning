import { fileGenerationService } from '@/services/fileGenerationService';

export const testAnswerKeyExtraction = () => {
  const testContent = `**Math Practice Worksheet**\n\n1. What is 5 + 3?\n   Answer: ___\n\n2. What is 10 - 4?\n   Answer: ___\n\n3. What is 2 x 6?\n   Answer: ___\n\n4. What is 15 ÷ 3?\n   Answer: ___\n\n5. What is 7 + 8?\n   Answer: ___\n\n[ANSWER_KEY_START]\n1. 8\n2. 6\n3. 12\n4. 5\n5. 15\n[ANSWER_KEY_END]`;

  const { mainContent, answerKey } = fileGenerationService.extractAnswerKey(testContent);
  
  console.log('=== Answer Key Extraction Test ===');
  console.log('Main Content:');
  console.log(mainContent);
  console.log('\nAnswer Key:');
  console.log(answerKey);
  console.log('================================');
  
  return { mainContent, answerKey };
};

export const testAnswerKeyExtractionDebug = () => {
  const testContent = `**Math Practice Worksheet**

1. What is 5 + 3?
   Answer: ___

2. What is 10 - 4?
   Answer: ___

3. What is 2 x 6?
   Answer: ___

4. What is 15 ÷ 3?
   Answer: ___

5. What is 7 + 8?
   Answer: ___

Answer Key:
1. 8
2. 6
3. 12
4. 5
5. 15`;

  console.log('=== Answer Key Extraction Debug ===');
  console.log('Original Content:');
  console.log(testContent);
  console.log('\n---');
  
  const { mainContent, answerKey } = fileGenerationService.extractAnswerKey(testContent);
  
  console.log('Extracted Main Content:');
  console.log(mainContent);
  console.log('\n---');
  console.log('Extracted Answer Key:');
  console.log(answerKey);
  console.log('================================');
  
  return { mainContent, answerKey };
};

export const testFileGeneration = async () => {
  const testContent = `**Math Practice Worksheet**\n\n1. What is 5 + 3?\n   Answer: ___\n\n2. What is 10 - 4?\n   Answer: ___\n\n3. What is 2 x 6?\n   Answer: ___\n\n4. What is 15 ÷ 3?\n   Answer: ___\n\n5. What is 7 + 8?\n   Answer: ___\n\n[ANSWER_KEY_START]\n1. 8\n2. 6\n3. 12\n4. 5\n5. 15\n[ANSWER_KEY_END]`;

  const options = {
    title: 'Simple Math Worksheet',
    content: testContent,
    type: 'worksheet' as const,
    format: 'pdf' as const,
    includeAnswers: true // Test with answer key included
  };

  try {
    const result = await fileGenerationService.generateFile(options);
    console.log('PDF generation successful:', result);
    return result;
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw error;
  }
};

export const testFileGenerationWithoutAnswers = async () => {
  const testContent = `**Math Practice Worksheet**\n\n1. What is 5 + 3?\n   Answer: ___\n\n2. What is 10 - 4?\n   Answer: ___\n\n3. What is 2 x 6?\n   Answer: ___\n\n4. What is 15 ÷ 3?\n   Answer: ___\n\n5. What is 7 + 8?\n   Answer: ___\n\n[ANSWER_KEY_START]\n1. 8\n2. 6\n3. 12\n4. 5\n5. 15\n[ANSWER_KEY_END]`;

  const options = {
    title: 'Simple Math Worksheet',
    content: testContent,
    type: 'worksheet' as const,
    format: 'pdf' as const,
    includeAnswers: false // Test without answer key
  };

  try {
    const result = await fileGenerationService.generateFile(options);
    console.log('PDF generation without answers successful:', result);
    return result;
  } catch (error) {
    console.error('PDF generation without answers failed:', error);
    throw error;
  }
};

export const testTextFileGeneration = async () => {
  const testContent = `**Math Practice Worksheet**\n\n1. What is 5 + 3?\n   Answer: ___\n\n2. What is 10 - 4?\n   Answer: ___\n\n3. What is 2 x 6?\n   Answer: ___\n\n4. What is 15 ÷ 3?\n   Answer: ___\n\n5. What is 7 + 8?\n   Answer: ___\n\n[ANSWER_KEY_START]\n1. 8\n2. 6\n3. 12\n4. 5\n5. 15\n[ANSWER_KEY_END]`;

  const options = {
    title: 'Simple Math Worksheet',
    content: testContent,
    type: 'worksheet' as const,
    format: 'txt' as const,
    includeAnswers: true
  };

  try {
    const result = await fileGenerationService.generateFile(options);
    console.log('Text file generation successful:', result);
    return result;
  } catch (error) {
    console.error('Text file generation failed:', error);
    throw error;
  }
};

export const testTextFileGenerationWithoutAnswers = async () => {
  const testContent = `**Math Practice Worksheet**\n\n1. What is 5 + 3?\n   Answer: ___\n\n2. What is 10 - 4?\n   Answer: ___\n\n3. What is 2 x 6?\n   Answer: ___\n\n4. What is 15 ÷ 3?\n   Answer: ___\n\n5. What is 7 + 8?\n   Answer: ___\n\n[ANSWER_KEY_START]\n1. 8\n2. 6\n3. 12\n4. 5\n5. 15\n[ANSWER_KEY_END]`;

  const options = {
    title: 'Simple Math Worksheet',
    content: testContent,
    type: 'worksheet' as const,
    format: 'txt' as const,
    includeAnswers: false
  };

  try {
    const result = await fileGenerationService.generateFile(options);
    console.log('Text file generation without answers successful:', result);
    return result;
  } catch (error) {
    console.error('Text file generation without answers failed:', error);
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