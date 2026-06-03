const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

let supabaseClient = null;

function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabaseClient;
}

async function signUp(email, password) {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

async function signIn(email, password) {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function signOut() {
  const client = getSupabaseClient();
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

async function getSession() {
  const client = getSupabaseClient();
  const { data: { session } } = await client.auth.getSession();
  return session;
}

async function getProfile() {
  const session = await getSession();
  if (!session) return null;
  const client = getSupabaseClient();
  const { data, error } = await client.from('profiles').select('*').eq('id', session.user.id).single();
  if (error) return null;
  return data;
}

async function updateProfile(updates) {
  const session = await getSession();
  if (!session) throw new Error('Not authenticated');
  const client = getSupabaseClient();
  const { data, error } = await client.from('profiles').update(updates).eq('id', session.user.id);
  if (error) throw error;
  return data;
}

async function createMatch(player1Id, player2Id, team1, team2, mode) {
  const session = await getSession();
  if (!session) throw new Error('Not authenticated');
  const client = getSupabaseClient();
  const { data, error } = await client.from('matches').insert({
    player1_id: player1Id,
    player2_id: player2Id,
    team1,
    team2,
    mode,
    status: 'active',
    turn: player1Id,
    started_at: new Date().toISOString()
  });
  if (error) throw error;
  return data[0];
}

async function getMatch(matchId) {
  const client = getSupabaseClient();
  const { data, error } = await client.from('matches').select('*').eq('id', matchId).single();
  if (error) throw error;
  return data;
}

async function updateMatch(matchId, updates) {
  const client = getSupabaseClient();
  const { data, error } = await client.from('matches').update(updates).eq('id', matchId);
  if (error) throw error;
  return data[0];
}

async function subscribeToMatch(matchId, callback) {
  const client = getSupabaseClient();
  return client.channel(`match:${matchId}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'matches',
      filter: `id=eq.${matchId}`
    }, callback)
    .subscribe();
}

async function findMatch(mode, team) {
  const session = await getSession();
  if (!session) throw new Error('Not authenticated');
  const client = getSupabaseClient();
  
  const { data, error } = await client.from('match_queue')
    .select('*')
    .eq('mode', mode)
    .neq('player_id', session.user.id)
    .limit(1);
  
  if (error) throw error;
  
  if (data && data.length > 0) {
    const existingQueue = data[0];
    await client.from('match_queue').delete().eq('id', existingQueue.id);
    const match = await createMatch(session.user.id, existingQueue.player_id, team, existingQueue.team, mode);
    return match;
  } else {
    await client.from('match_queue').insert({
      player_id: session.user.id,
      mode,
      team
    });
    return null;
  }
}

async function checkQueue() {
  const session = await getSession();
  if (!session) return null;
  const client = getSupabaseClient();
  
  const { data, error } = await client.from('match_queue')
    .select('*, matches(*)')
    .eq('player_id', session.user.id)
    .limit(1);
  
  if (error) throw error;
  return data && data.length > 0 ? data[0] : null;
}

async function leaveQueue() {
  const session = await getSession();
  if (!session) return;
  const client = getSupabaseClient();
  await client.from('match_queue').delete().eq('player_id', session.user.id);
}
