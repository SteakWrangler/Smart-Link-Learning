
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not found in environment variables');
    }

    const { messages, model = 'gpt-4.1-2025-04-14' } = await req.json();

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response.';
    const finishReason = data.choices[0]?.finish_reason;
    
    // Handle truncated responses
    if (finishReason === 'length') {
      console.log('Response truncated, attempting to create a complete shorter version...');
      
      const truncationMessages: ChatMessage[] = [
        {
          role: 'system',
          content: `The previous response was truncated due to length limits. You need to provide a complete, well-formed response that covers about 80% of the original request. Make sure your response is complete and doesn't end abruptly.

Original truncated response:
${aiResponse}

Please provide a shorter but complete version that covers the most important parts of the request. End with a note that says "If you need more content, ask me to continue or provide additional examples."`
        },
        {
          role: 'user',
          content: 'Please provide the shortened, complete version.'
        }
      ];
      
      try {
        const shortenedResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: truncationMessages,
            max_tokens: 3000,
            temperature: 0.7,
          }),
        });
        
        if (shortenedResponse.ok) {
          const shortenedData = await shortenedResponse.json();
          const shortenedContent = shortenedData.choices[0]?.message?.content;
          if (shortenedContent) {
            return new Response(JSON.stringify({ response: shortenedContent }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
      } catch (error) {
        console.error('Error creating shortened response:', error);
      }
      
      return new Response(JSON.stringify({ 
        response: aiResponse + '\n\n⚠️ **Response was too long and got truncated.** If you need more content, please ask me to continue or break your request into smaller parts.' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in chat-with-ai function:', error);
    
    let errorMessage = 'I encountered an error while generating a response. Please try again.';
    
    if (error.message.includes('API key')) {
      errorMessage = 'Please check your OpenAI API key configuration.';
    } else if (error.message.includes('quota')) {
      errorMessage = 'OpenAI API quota exceeded. Please check your billing settings.';
    } else if (error.message.includes('rate limit')) {
      errorMessage = 'Rate limit exceeded. Please try again in a moment.';
    }
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
