import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  console.log("Webhook received - method:", req.method);
  console.log("Webhook received - headers:", Object.fromEntries(req.headers.entries()));
  
  return new Response("OK", { 
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "text/plain",
    }
  });
}); 