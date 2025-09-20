import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting cleanup process...');

    // Delete messages older than 2 days
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const { data: deletedMessages, error: deleteError } = await supabase
      .from('messages')
      .delete()
      .lt('created_at', twoDaysAgo.toISOString());

    if (deleteError) {
      console.error('Error deleting messages:', deleteError);
      throw deleteError;
    }

    console.log(`Deleted old messages: ${deletedMessages?.length || 0} messages`);

    // Clean up empty conversations (optional)
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('id, (messages(count))')
      .eq('messages.count', 0);

    if (!convError && conversations) {
      for (const conversation of conversations) {
        await supabase
          .from('conversations')
          .delete()
          .eq('id', conversation.id);
      }
      console.log(`Cleaned up ${conversations.length} empty conversations`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        deletedMessages: deletedMessages?.length || 0,
        cleanedConversations: conversations?.length || 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Cleanup error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});