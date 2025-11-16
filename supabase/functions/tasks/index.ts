import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const url = new URL(req.url);
    const taskId = url.searchParams.get('id');
    const method = req.method;

    // GET /tasks - List tasks with geo-filtering
    if (method === 'GET' && !taskId) {
      const lat = parseFloat(url.searchParams.get('lat') || '0');
      const lng = parseFloat(url.searchParams.get('lng') || '0');
      const radius = parseFloat(url.searchParams.get('radius') || '20');

      // Get open tasks with address info
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select(`
          *,
          category:categories(*),
          address:addresses(*),
          client:clients(
            userid,
            user:users(name, surname, email)
          )
        `)
        .eq('status', 'Open');

      if (error) throw error;

      // Filter by distance if lat/lng provided
      const filteredTasks = lat && lng ? tasks?.filter(task => {
        const distance = calculateDistance(
          lat,
          lng,
          parseFloat(task.address.latitude),
          parseFloat(task.address.longitude)
        );
        return distance <= radius;
      }) : tasks;

      return new Response(
        JSON.stringify({ tasks: filteredTasks }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /tasks?id=xxx - Get single task
    if (method === 'GET' && taskId) {
      const { data: task, error } = await supabase
        .from('tasks')
        .select(`
          *,
          category:categories(*),
          address:addresses(*),
          client:clients(
            userid,
            user:users(name, surname)
          )
        `)
        .eq('task_id', taskId)
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ task }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /tasks - Create task
    if (method === 'POST') {
      const body = await req.json();
      const { title, description, budget, category_id, address_id, is_repeat } = body;

      // Get user's client_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Unauthorized');

      const { data: client } = await supabase
        .from('clients')
        .select('client_id')
        .eq('userid', user.id)
        .single();

      if (!client) throw new Error('Client profile not found');

      const { data: task, error } = await supabase
        .from('tasks')
        .insert({
          client_id: client.client_id,
          category_id,
          address_id,
          title,
          description,
          budget,
          is_repeat: is_repeat || false,
          status: 'Open',
        })
        .select()
        .single();

      if (error) throw error;

      console.log('Task created:', task.task_id);

      return new Response(
        JSON.stringify({ task }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Tasks error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Haversine distance calculation
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
