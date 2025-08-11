import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log("Webhook received - method:", req.method);
  console.log("Webhook received - headers:", Object.fromEntries(req.headers.entries()));
  
  return new Response("OK", { 
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "text/plain",
    }
  });
}); 