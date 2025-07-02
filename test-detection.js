// Test cases for content detection logic
const testContentDetection = () => {
  const testCases = [
    {
      name: "Worksheet with numbered problems",
      content: `Math Worksheet

1. 5 + 3 = ___
2. 10 - 4 = ___
3. 2 x 6 = ___

Answers:
1. 8
2. 6
3. 12`,
      shouldBeDownloadable: true
    },
    {
      name: "Practice test with questions and answers",
      content: `Science Practice Test

Questions:
1. What planet is closest to the Sun?
2. How many planets are in our solar system?

Your Answers:
1. _______
2. _______

Answer Key:
1. Mercury
2. 8`,
      shouldBeDownloadable: true
    },
    {
      name: "Activity with numbered steps",
      content: `Dinosaur Activity

Instructions:
1. Draw your favorite dinosaur
2. Write three facts about it
3. Create a story about your dinosaur

Materials needed:
- Paper
- Crayons
- Imagination!`,
      shouldBeDownloadable: true
    },
    {
      name: "Prompt/request (should not be downloadable)",
      content: "Can you create a math worksheet about dinosaurs for my 8-year-old?",
      shouldBeDownloadable: false
    },
    {
      name: "Brief acknowledgment (should not be downloadable)",
      content: "Sure! Here's a fun dinosaur math worksheet for your 8-year-old.",
      shouldBeDownloadable: false
    },
    {
      name: "Conversation response (should not be downloadable)",
      content: "That sounds great! I understand you want to work on math. Let me help you with some dinosaur-themed problems.",
      shouldBeDownloadable: false
    },
    {
      name: "General explanation (should not be downloadable)",
      content: "Here are some suggestions for helping with math anxiety. You can try breaking problems into smaller steps and using visual aids.",
      shouldBeDownloadable: false
    }
  ];

  console.log('Testing content detection logic...\n');

  testCases.forEach((testCase, index) => {
    // Simulate the detection logic
    const lowerContent = testCase.content.toLowerCase();
    
    const isPromptOrRequest = (
      lowerContent.includes('can you') || 
      lowerContent.includes('please create') || 
      lowerContent.includes('i would like') ||
      lowerContent.includes('make me') ||
      lowerContent.includes('generate') ||
      lowerContent.includes('create a') ||
      lowerContent.includes('give me') ||
      lowerContent.includes('i need') ||
      lowerContent.includes('could you') ||
      (lowerContent.startsWith('here') && testCase.content.length < 100) ||
      (lowerContent.startsWith('sure') && testCase.content.length < 100) ||
      (lowerContent.startsWith('of course') && testCase.content.length < 100) ||
      (testCase.content.length < 80 && lowerContent.includes('create'))
    );
    
    const hasGeneratedContent = (
      /\d+\.\s/.test(testCase.content) ||
      /___|______|blank|answer:?\s*_/.test(lowerContent) ||
      (lowerContent.includes('questions:') && lowerContent.includes('answers:')) ||
      (lowerContent.includes('problems:') && lowerContent.includes('solutions:')) ||
      (lowerContent.includes('worksheet') && /\d+\./.test(testCase.content)) ||
      (lowerContent.includes('practice test') && /\d+\./.test(testCase.content)) ||
      (lowerContent.includes('activity') && /\d+\./.test(testCase.content)) ||
      (lowerContent.includes('game') && /\d+\./.test(testCase.content)) ||
      (testCase.content.split('\n').length > 6 && /\d+\./.test(testCase.content))
    );
    
    const hasSubstantialContent = testCase.content.length > 150;
    
    const isNotJustConversation = !(
      lowerContent.includes('that sounds great') ||
      lowerContent.includes('i understand') ||
      lowerContent.includes('let me help') ||
      lowerContent.includes('here are some') ||
      lowerContent.includes('you can try') ||
      lowerContent.includes('some suggestions') ||
      lowerContent.includes('here are a few')
    );
    
    const isDownloadable = !isPromptOrRequest && hasGeneratedContent && hasSubstantialContent && isNotJustConversation;
    
    const result = isDownloadable === testCase.shouldBeDownloadable ? '✅ PASS' : '❌ FAIL';
    
    console.log(`${index + 1}. ${testCase.name}: ${result}`);
    console.log(`   Expected: ${testCase.shouldBeDownloadable}, Got: ${isDownloadable}`);
    console.log(`   Content length: ${testCase.content.length}`);
    console.log(`   Has numbers: ${/\d+\.\s/.test(testCase.content)}`);
    console.log(`   Is prompt: ${isPromptOrRequest}`);
    console.log(`   Has generated content: ${hasGeneratedContent}`);
    console.log(`   Has substantial content: ${hasSubstantialContent}`);
    console.log(`   Not just conversation: ${isNotJustConversation}`);
    console.log('');
  });
};

testContentDetection(); 