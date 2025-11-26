import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QueryPoliceRequest {
  lat: number;
  lng: number;
  session_id?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lat, lng, session_id }: QueryPoliceRequest = await req.json();

    if (!lat || !lng) {
      return new Response(
        JSON.stringify({ success: false, error: 'Latitude and longitude are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const GOOGLE_PLACES_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY');

    if (!GOOGLE_PLACES_API_KEY) {
      console.warn('⚠️ GOOGLE_PLACES_API_KEY not configured - using test mode');
      
      // Test mode - return mock data
      const mockPoliceStation = {
        name: "Miami Beach Police Department",
        address: "1100 Washington Ave, Miami Beach, FL 33139",
        phone: "(305) 673-7900",
        distance: 0.3,
        distance_meters: 482,
        google_maps_link: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
        place_id: "test_place_id",
      };

      // Update session if provided
      if (session_id) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        await supabase
          .from('dateguard_sessions')
          .update({ nearest_police: mockPoliceStation })
          .eq('id', session_id);
      }

      return new Response(
        JSON.stringify({
          success: true,
          test_mode: true,
          police_station: mockPoliceStation,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Real API call to Google Places
    const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=police&key=${GOOGLE_PLACES_API_KEY}`;

    const response = await fetch(placesUrl);
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API error: ${data.status}`);
    }

    if (data.results && data.results.length > 0) {
      const nearest = data.results[0];
      const place = nearest.geometry.location;

      // Calculate distance (simple haversine approximation)
      const distanceKm = Math.sqrt(
        Math.pow((place.lat - lat) * 111, 2) + 
        Math.pow((place.lng - lng) * 111 * Math.cos(lat * Math.PI / 180), 2)
      );
      const distanceMiles = distanceKm * 0.621371;

      // Get place details for phone number
      let phone = "Not available";
      try {
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${nearest.place_id}&fields=formatted_phone_number&key=${GOOGLE_PLACES_API_KEY}`;
        const detailsResponse = await fetch(detailsUrl);
        const detailsData = await detailsResponse.json();
        if (detailsData.result?.formatted_phone_number) {
          phone = detailsData.result.formatted_phone_number;
        }
      } catch (e) {
        console.warn('Could not fetch phone number:', e);
      }

      const policeStation = {
        name: nearest.name,
        address: nearest.vicinity || nearest.formatted_address || "Address not available",
        phone: phone,
        distance: parseFloat(distanceMiles.toFixed(1)),
        distance_meters: Math.round(distanceKm * 1000),
        google_maps_link: `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`,
        place_id: nearest.place_id,
      };

      // Update session if provided
      if (session_id) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        await supabase
          .from('dateguard_sessions')
          .update({ nearest_police: policeStation })
          .eq('id', session_id);
      }

      return new Response(
        JSON.stringify({
          success: true,
          police_station: policeStation,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No police stations found nearby',
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in query-nearest-police:', error);
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


