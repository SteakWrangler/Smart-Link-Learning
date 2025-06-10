
import { supabase } from '@/integrations/supabase/client';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export const generateChatResponse = async (
  messages: ChatMessage[],
  model: string = 'gpt-4.1-2025-04-14'
): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke('chat-with-ai', {
      body: {
        messages,
        model
      }
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw error;
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    return data?.response || 'I apologize, but I was unable to generate a response.';
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

// Remove the default export as it's no longer needed
export default null;
