// Comprehensive test for answer blank patterns
const testComprehensivePatterns = () => {
  const testCases = [
    // Basic blanks
    {
      name: "Basic underscores",
      content: "1. 5 + 3 = ___",
      shouldBeDownloadable: true
    },
    {
      name: "Multiple underscores",
      content: "2. What is your name? ______",
      shouldBeDownloadable: true
    },
    {
      name: "Brackets",
      content: "3. Complete the sentence: The cat is [ ]",
      shouldBeDownloadable: true
    },
    {
      name: "Parentheses",
      content: "4. Fill in: ( )",
      shouldBeDownloadable: true
    },
    
    // Answer prompts
    {
      name: "Answer prompt",
      content: "1. What is 2+2? Answer: ___",
      shouldBeDownloadable: true
    },
    {
      name: "Your answer prompt",
      content: "2. What color is the sky? Your answer: ______",
      shouldBeDownloadable: true
    },
    {
      name: "Write your answer",
      content: "3. Write your answer: ___",
      shouldBeDownloadable: true
    },
    {
      name: "Answer below",
      content: "4. Answer below: ___",
      shouldBeDownloadable: true
    },
    
    // Multiple choice
    {
      name: "Circle correct answer",
      content: "1. What planet is closest to the Sun?\nA) Earth B) Mars C) Mercury D) Venus\nCircle the correct answer: ___",
      shouldBeDownloadable: true
    },
    {
      name: "Choose answer",
      content: "2. Choose the correct answer: ___",
      shouldBeDownloadable: true
    },
    {
      name: "Write letter",
      content: "3. Write the letter of your answer: ___",
      shouldBeDownloadable: true
    },
    
    // Subject-specific
    {
      name: "Solve prompt",
      content: "1. Solve: ___",
      shouldBeDownloadable: true
    },
    {
      name: "Calculate prompt",
      content: "2. Calculate: ___",
      shouldBeDownloadable: true
    },
    {
      name: "Find prompt",
      content: "3. Find: ___",
      shouldBeDownloadable: true
    },
    {
      name: "Write prompt",
      content: "4. Write: ___",
      shouldBeDownloadable: true
    },
    {
      name: "Draw prompt",
      content: "5. Draw: ___",
      shouldBeDownloadable: true
    },
    {
      name: "Label prompt",
      content: "6. Label: ___",
      shouldBeDownloadable: true
    },
    
    // Reading comprehension
    {
      name: "Reading comprehension",
      content: "Reading comprehension: ___",
      shouldBeDownloadable: true
    },
    {
      name: "Comprehension question",
      content: "Comprehension question: ___",
      shouldBeDownloadable: true
    },
    
    // Writing
    {
      name: "Essay question",
      content: "Essay question: ___",
      shouldBeDownloadable: true
    },
    {
      name: "Writing prompt",
      content: "Writing prompt: ___",
      shouldBeDownloadable: true
    },
    {
      name: "Response prompt",
      content: "Response: ___",
      shouldBeDownloadable: true
    },
    
    // Science
    {
      name: "Hypothesis",
      content: "Hypothesis: ___",
      shouldBeDownloadable: true
    },
    {
      name: "Observation",
      content: "Observation: ___",
      shouldBeDownloadable: true
    },
    {
      name: "Conclusion",
      content: "Conclusion: ___",
      shouldBeDownloadable: true
    },
    
    // Math
    {
      name: "Show your work",
      content: "Show your work: ___",
      shouldBeDownloadable: true
    },
    {
      name: "Work space",
      content: "Work space: ___",
      shouldBeDownloadable: true
    },
    
    // General educational
    {
      name: "Question prompt",
      content: "Question: ___",
      shouldBeDownloadable: true
    },
    {
      name: "Problem prompt",
      content: "Problem: ___",
      shouldBeDownloadable: true
    },
    {
      name: "Activity prompt",
      content: "Activity: ___",
      shouldBeDownloadable: true
    },
    
    // Numbered items
    {
      name: "Numbered with blanks",
      content: "1. What is 2+2? ___",
      shouldBeDownloadable: true
    },
    {
      name: "Numbered with answer",
      content: "1. What is 2+2? Answer: ___",
      shouldBeDownloadable: true
    },
    
    // Multiple choice with letters
    {
      name: "Multiple choice with answer",
      content: "A) Option 1 B) Option 2 Answer: ___",
      shouldBeDownloadable: true
    },
    
    // Instructions
    {
      name: "Instructions with blanks",
      content: "Instructions: Complete the following ___",
      shouldBeDownloadable: true
    },
    
    // Generic responses
    {
      name: "Your response",
      content: "Your response: ___",
      shouldBeDownloadable: true
    },
    {
      name: "Your work",
      content: "Your work: ___",
      shouldBeDownloadable: true
    },
    
    // Should NOT be downloadable
    {
      name: "No blanks - just explanation",
      content: "Here's how to solve this problem. First, you need to understand the concept of addition.",
      shouldBeDownloadable: false
    },
    {
      name: "Prompt/request",
      content: "Can you create a math worksheet?",
      shouldBeDownloadable: false
    },
    {
      name: "Brief acknowledgment",
      content: "Sure! Here's a worksheet for you.",
      shouldBeDownloadable: false
    },
    {
      name: "Conversation",
      content: "That sounds great! I understand you want to work on math.",
      shouldBeDownloadable: false
    }
  ];

  console.log('Testing comprehensive answer blank patterns...\n');

  testCases.forEach((testCase, index) => {
    // Simulate the detection logic
    const lowerContent = testCase.content.toLowerCase();
    
    const answerBlankPatterns = [
      // Basic blanks and spaces
      /___+/g,
      /\[[\s_]*\]/g,
      /\([\s_]*\)/g,
      /[\s_]{3,}/g,
      /\.{3,}/g,
      /-{3,}/g,
      
      // Answer prompts with blanks
      /answer:?\s*[_\s\.\-]+/gi,
      /your answer:?\s*[_\s\.\-]+/gi,
      /write your answer:?\s*[_\s\.\-]+/gi,
      /fill in:?\s*[_\s\.\-]+/gi,
      /complete:?\s*[_\s\.\-]+/gi,
      /write below:?\s*[_\s\.\-]+/gi,
      /answer below:?\s*[_\s\.\-]+/gi,
      /response below:?\s*[_\s\.\-]+/gi,
      
      // Multiple choice patterns
      /circle\s+(?:the\s+)?(?:correct\s+)?answer:?\s*[_\s\.\-]+/gi,
      /choose\s+(?:the\s+)?(?:correct\s+)?answer:?\s*[_\s\.\-]+/gi,
      /select\s+(?:the\s+)?(?:correct\s+)?answer:?\s*[_\s\.\-]+/gi,
      /write\s+(?:the\s+)?letter:?\s*[_\s\.\-]+/gi,
      /mark\s+(?:the\s+)?(?:correct\s+)?answer:?\s*[_\s\.\-]+/gi,
      /pick\s+(?:the\s+)?(?:correct\s+)?answer:?\s*[_\s\.\-]+/gi,
      
      // Subject-specific patterns
      /solve:?\s*[_\s\.\-]+/gi,
      /calculate:?\s*[_\s\.\-]+/gi,
      /find:?\s*[_\s\.\-]+/gi,
      /write:?\s*[_\s\.\-]+/gi,
      /draw:?\s*[_\s\.\-]+/gi,
      /label:?\s*[_\s\.\-]+/gi,
      /show:?\s*[_\s\.\-]+/gi,
      /explain:?\s*[_\s\.\-]+/gi,
      /describe:?\s*[_\s\.\-]+/gi,
      /list:?\s*[_\s\.\-]+/gi,
      /name:?\s*[_\s\.\-]+/gi,
      /identify:?\s*[_\s\.\-]+/gi,
      /match:?\s*[_\s\.\-]+/gi,
      /compare:?\s*[_\s\.\-]+/gi,
      /contrast:?\s*[_\s\.\-]+/gi,
      
      // Reading comprehension patterns
      /reading\s+comprehension:?\s*[_\s\.\-]+/gi,
      /comprehension\s+question:?\s*[_\s\.\-]+/gi,
      /reading\s+question:?\s*[_\s\.\-]+/gi,
      /story\s+question:?\s*[_\s\.\-]+/gi,
      /passage\s+question:?\s*[_\s\.\-]+/gi,
      
      // Writing prompts
      /essay\s+question:?\s*[_\s\.\-]+/gi,
      /writing\s+prompt:?\s*[_\s\.\-]+/gi,
      /response:?\s*[_\s\.\-]+/gi,
      /paragraph:?\s*[_\s\.\-]+/gi,
      /sentence:?\s*[_\s\.\-]+/gi,
      /story:?\s*[_\s\.\-]+/gi,
      /letter:?\s*[_\s\.\-]+/gi,
      /report:?\s*[_\s\.\-]+/gi,
      
      // Science/experiment patterns
      /hypothesis:?\s*[_\s\.\-]+/gi,
      /observation:?\s*[_\s\.\-]+/gi,
      /conclusion:?\s*[_\s\.\-]+/gi,
      /prediction:?\s*[_\s\.\-]+/gi,
      /experiment:?\s*[_\s\.\-]+/gi,
      /results:?\s*[_\s\.\-]+/gi,
      /data:?\s*[_\s\.\-]+/gi,
      /analysis:?\s*[_\s\.\-]+/gi,
      
      // Math-specific patterns
      /show\s+your\s+work:?\s*[_\s\.\-]+/gi,
      /work\s+space:?\s*[_\s\.\-]+/gi,
      /equation:?\s*[_\s\.\-]+/gi,
      /formula:?\s*[_\s\.\-]+/gi,
      /solution:?\s*[_\s\.\-]+/gi,
      /steps:?\s*[_\s\.\-]+/gi,
      /method:?\s*[_\s\.\-]+/gi,
      
      // General educational patterns
      /question:?\s*[_\s\.\-]+/gi,
      /problem:?\s*[_\s\.\-]+/gi,
      /activity:?\s*[_\s\.\-]+/gi,
      /exercise:?\s*[_\s\.\-]+/gi,
      /assignment:?\s*[_\s\.\-]+/gi,
      /task:?\s*[_\s\.\-]+/gi,
      /challenge:?\s*[_\s\.\-]+/gi,
      /puzzle:?\s*[_\s\.\-]+/gi,
      /game:?\s*[_\s\.\-]+/gi,
      
      // Numbered items with blanks
      /\d+\.\s*[^_]*[_\s\.\-]{3,}/g,
      /\d+\)\s*[^_]*[_\s\.\-]{3,}/g,
      /\d+\.\s*[^_]*\s*answer:?\s*[_\s\.\-]+/gi,
      /\d+\)\s*[^_]*\s*answer:?\s*[_\s\.\-]+/gi,
      
      // Multiple choice with letters
      /[a-d]\)\s*[^_]*\s*answer:?\s*[_\s\.\-]+/gi,
      /[a-d]\)\s*[^_]*\s*choose:?\s*[_\s\.\-]+/gi,
      /[a-d]\)\s*[^_]*\s*select:?\s*[_\s\.\-]+/gi,
      
      // Instructions with blanks
      /instructions:?\s*[^_]*[_\s\.\-]{3,}/gi,
      /directions:?\s*[^_]*[_\s\.\-]{3,}/gi,
      /steps:?\s*[^_]*[_\s\.\-]{3,}/gi,
      
      // Generic answer spaces
      /your\s+response:?\s*[_\s\.\-]+/gi,
      /your\s+answer:?\s*[_\s\.\-]+/gi,
      /your\s+work:?\s*[_\s\.\-]+/gi,
      /your\s+thinking:?\s*[_\s\.\-]+/gi,
      /your\s+explanation:?\s*[_\s\.\-]+/gi,
      
      // Blank lines that suggest writing space
      /\n\s*\n\s*\n/g,
      /\n\s*[_\s\.\-]{5,}\s*\n/g,
    ];
    
    const hasAnswerBlanks = answerBlankPatterns.some(pattern => pattern.test(testCase.content));
    const hasSubstantialContent = testCase.content.length > 50;
    
    const isNotJustConversation = !(
      lowerContent.includes('that sounds great') ||
      lowerContent.includes('i understand') ||
      lowerContent.includes('let me help') ||
      lowerContent.includes('here are some') ||
      lowerContent.includes('you can try') ||
      lowerContent.includes('some suggestions') ||
      lowerContent.includes('here are a few') ||
      lowerContent.includes('can you') ||
      lowerContent.includes('please create') ||
      lowerContent.includes('i would like') ||
      lowerContent.includes('make me') ||
      lowerContent.includes('generate') ||
      lowerContent.includes('create a') ||
      lowerContent.includes('give me') ||
      lowerContent.includes('i need') ||
      lowerContent.includes('could you')
    );
    
    const isDownloadable = hasAnswerBlanks && hasSubstantialContent && isNotJustConversation;
    
    const result = isDownloadable === testCase.shouldBeDownloadable ? '✅ PASS' : '❌ FAIL';
    
    console.log(`${index + 1}. ${testCase.name}: ${result}`);
    console.log(`   Content: "${testCase.content.substring(0, 50)}..."`);
    console.log(`   Expected: ${testCase.shouldBeDownloadable}, Got: ${isDownloadable}`);
    console.log(`   Has answer blanks: ${hasAnswerBlanks}`);
    console.log(`   Has substantial content: ${hasSubstantialContent}`);
    console.log(`   Not just conversation: ${isNotJustConversation}`);
    console.log('');
  });
};

testComprehensivePatterns(); 