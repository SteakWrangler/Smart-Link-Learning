import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, you'd want this in a backend API
});

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Helper function to detect if a response seems incomplete (generic patterns)
const isResponseIncomplete = (response: string): boolean => {
  const trimmed = response.trim();
  
  // Generic signs of incomplete responses
  const incompleteIndicators = [
    // Ends mid-sentence or mid-word
    /[a-zA-Z]\s*$/,  // Ends with a single letter
    /,\s*$/,         // Ends with comma
    /and\s*$/i,      // Ends with "and"
    /the\s*$/i,      // Ends with "the"
    /of\s*$/i,       // Ends with "of"
    /to\s*$/i,       // Ends with "to"
    /:\s*$/,         // Ends with colon
    /\d+\.\s*$/,     // Ends with number and period (list item without content)
    /-\s*$/,         // Ends with dash (bullet point without content)
    /\*\s*$/,        // Ends with asterisk (markdown bullet without content)
  ];
  
  // Also check if the response is suspiciously short for what might be a long request
  // This is a simple heuristic - very short responses might indicate truncation
  const seemsTruncated = trimmed.length < 50 && !trimmed.endsWith('.') && !trimmed.endsWith('!') && !trimmed.endsWith('?');
  
  return incompleteIndicators.some(pattern => pattern.test(trimmed)) || seemsTruncated;
};

export const generateChatResponse = async (
  messages: ChatMessage[],
  model: string = 'gpt-4o' // Using GPT-4o for best performance
): Promise<string> => {
  try {
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      throw new Error('OpenAI API key not found. Please set VITE_OPENAI_API_KEY in your .env.local file.');
    }

    const completion = await openai.chat.completions.create({
      model,
      messages,
      max_tokens: 1000, // Lower limit to test intelligent truncation handling
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response.';
    const finishReason = completion.choices[0]?.finish_reason;
    
    // Check if response was truncated due to token limit
    if (finishReason === 'length') {
      console.log('Response truncated, attempting to create a complete shorter version...');
      
      // Send the truncated response back to AI to create a complete, shorter version
      const truncationMessages: ChatMessage[] = [
        {
          role: 'system',
          content: `The previous response was truncated due to length limits. You need to provide a complete, well-formed response that covers about 80% of the original request. Make sure your response is complete and doesn't end abruptly.

Original truncated response:
${response}

Please provide a shorter but complete version that covers the most important parts of the request. End with a note that says "If you need more content, ask me to continue or provide additional examples."`
        },
        {
          role: 'user',
          content: 'Please provide the shortened, complete version.'
        }
      ];
      
      try {
        const shortenedCompletion = await openai.chat.completions.create({
          model,
          messages: truncationMessages,
          max_tokens: 3000, // Slightly less to ensure completion
          temperature: 0.7,
        });
        
        const shortenedResponse = shortenedCompletion.choices[0]?.message?.content;
        if (shortenedResponse) {
          return shortenedResponse;
        }
      } catch (error) {
        console.error('Error creating shortened response:', error);
      }
      
      // Fallback if the shortening fails
      return response + '\n\n⚠️ **Response was too long and got truncated.** If you need more content, please ask me to continue or break your request into smaller parts.';
    }
    
    // Check if response seems incomplete (heuristic checks)
    if (isResponseIncomplete(response)) {
      return response + '\n\n⚠️ **This response may be incomplete.** If you were expecting more content, please ask me to continue or clarify what you need!';
    }

    return response;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return 'Please check your OpenAI API key configuration.';
      } else if (error.message.includes('quota')) {
        return 'OpenAI API quota exceeded. Please check your billing settings.';
      } else if (error.message.includes('rate limit')) {
        return 'Rate limit exceeded. Please try again in a moment.';
      }
    }
    
    return 'I encountered an error while generating a response. Please try again.';
  }
};

export default openai; 