import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateQRCodeRequest {
  custom_code_id: string;
  code: string;
  referral_url: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      custom_code_id,
      code,
      referral_url
    }: GenerateQRCodeRequest = await req.json();

    if (!custom_code_id || !code || !referral_url) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate QR code using a QR code API or library
    // For demo purposes, we'll use a simple QR code generation service
    // In production, you might use a library like qrcode or an API service
    const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(referral_url)}`;
    
    // Fetch QR code image
    const qrResponse = await fetch(qrCodeApiUrl);
    if (!qrResponse.ok) {
      throw new Error('Failed to generate QR code');
    }

    const qrImageBlob = await qrResponse.blob();
    const qrImageArrayBuffer = await qrImageBlob.arrayBuffer();
    const qrImageBytes = new Uint8Array(qrImageArrayBuffer);

    // Upload to Supabase Storage
    const fileName = `qr-codes/${custom_code_id}.png`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('influencer-assets')
      .upload(fileName, qrImageBytes, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      console.error('Error uploading QR code:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('influencer-assets')
      .getPublicUrl(fileName);

    const qrCodeUrl = urlData.publicUrl;

    // Update code record with QR URL
    await supabase
      .from('influencer_custom_codes')
      .update({ qr_code_url: qrCodeUrl })
      .eq('id', custom_code_id);

    console.log('✅ QR code generated:', qrCodeUrl);

    return new Response(
      JSON.stringify({ 
        success: true,
        qr_code_url: qrCodeUrl,
        message: 'QR code generated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-qr-code:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});


