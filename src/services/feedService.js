import { supabase } from '../lib/supabase';

export const feedService = {
  async getAll() {
    const { data, error } = await supabase
      .from('feed_posts')
      .select('*')
      // Exclude posts that have already expired on the server side.
      // Posts with no expires_at are treated as permanent.
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order('created_at', { ascending: false })
      .limit(30); // Carrega os 30 mais recentes; use getPaged() para paginação
    if (error) return { data: null, error };
    return { data: data.map(_mapPost), error: null };
  },

  /**
   * Paginação por cursor — use no lugar de getAll() para feeds longos.
   * Retorna `nextCursor` (created_at do último item) para buscar a próxima página.
   *
   * @param {string|null} cursor  created_at do último post da página anterior
   * @param {number}      limit   posts por página (padrão 20)
   * @returns {{ data, error, nextCursor: string|null }}
   */
  async getPaged(cursor = null, limit = 20) {
    let q = supabase
      .from('feed_posts')
      .select('*')
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (cursor) q = q.lt('created_at', cursor);
    const { data, error } = await q;
    if (error) return { data: null, error, nextCursor: null };
    const nextCursor = data.length === limit ? data[data.length - 1].created_at : null;
    return { data: data.map(_mapPost), error: null, nextCursor };
  },

  async getByEvent(eventId) {
    const { data, error } = await supabase
      .from('feed_posts')
      .select('*')
      .eq('event_id', eventId)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) return { data: null, error };
    return { data: data.map(_mapPost), error: null };
  },

  async create(post, user) {
    const { data, error } = await supabase
      .from('feed_posts')
      .insert({
        event_id: post.eventId,
        event_name: post.eventName,
        user_id: user.id,
        user_name: (user.name ?? 'U').split(' ')[0] || 'U',
        user_initials: user.avatar,
        user_color: '#9FE1CB',
        text: post.text,
        photos: Array.isArray(post.photos) ? post.photos : [],
        tag: post.tag,
        type: post.type,
        verified: post.verified ?? false,
        expires_at: post.expiresAt ?? null,
        dislikes: 0,
      })
      .select()
      .single();
    if (error) return { data: null, error };
    return { data: _mapPost(data), error: null };
  },

  async like(postId) {
    // Caminho atômico — sem race condition
    const { error: rpcErr } = await supabase.rpc('increment_post_likes', { p_post_id: postId });
    if (!rpcErr) return { error: null };
    // Fallback read-then-write (caso a RPC não exista no ambiente)
    console.warn('[feedService.like] RPC falhou, usando fallback:', rpcErr.message);
    const { data: post } = await supabase.from('feed_posts').select('likes').eq('id', postId).single();
    if (!post) return { error: 'Post não encontrado.' };
    const { error } = await supabase.from('feed_posts').update({ likes: (post.likes ?? 0) + 1 }).eq('id', postId);
    return { error };
  },

  async dislike(postId) {
    // Caminho atômico — sem race condition
    const { error: rpcErr } = await supabase.rpc('increment_post_dislikes', { p_post_id: postId });
    if (!rpcErr) return { error: null };
    // Fallback read-then-write (caso a RPC não exista no ambiente)
    console.warn('[feedService.dislike] RPC falhou, usando fallback:', rpcErr.message);
    const { data: post } = await supabase.from('feed_posts').select('dislikes').eq('id', postId).single();
    if (!post) return { error: 'Post não encontrado.' };
    const { error } = await supabase.from('feed_posts').update({ dislikes: (post.dislikes ?? 0) + 1 }).eq('id', postId);
    return { error };
  },

  /**
   * Expires all feed posts linked to an event by setting expires_at = NOW().
   * Called when the event is closed so the posts stop appearing in all feeds.
   *
   * @param {string} eventId  UUID of the event being closed.
   * @returns {Promise<{ error: any }>}
   */
  async closeByEvent(eventId) {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('feed_posts')
      .update({ expires_at: now })
      .eq('event_id', eventId);
    return { error };
  },

  /**
   * Expira posts de múltiplos eventos em uma única query (batch).
   * Substitui N chamadas sequenciais — elimina N+1 no autoManageEvents.
   * @param {string[]} eventIds
   */
  async closeByEventsBatch(eventIds) {
    if (!eventIds?.length) return { error: null };
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('feed_posts')
      .update({ expires_at: now })
      .in('event_id', eventIds);
    return { error };
  },

  subscribe(callback) {
    return supabase
      .channel('feed_posts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'feed_posts' }, payload => {
        callback(_mapPost(payload.new));
      })
      .subscribe();
  },
};

function _mapPost(d) {
  const timeAgo = Math.floor((Date.now() - new Date(d.created_at).getTime()) / 60000);
  const expiresAt = d.expires_at ? new Date(d.expires_at) : null;
  return {
    id: d.id,
    authorId: d.user_id,   // used by SocialEngagementStrategy
    eventId: d.event_id,
    eventName: d.event_name,
    user: {
      name: d.user_name,
      initials: d.user_initials,
      color: d.user_color ?? '#9FE1CB',
      textColor: '#04342C',
    },
    text: d.text,
    tag: d.tag,
    type: d.type ?? 'geral',
    likes: d.likes ?? 0,
    dislikes: d.dislikes ?? 0,
    replies: d.replies ?? 0,
    verified: d.verified ?? false,
    time: timeAgo === 0 ? 'agora mesmo' : `há ${timeAgo} min`,
    timeAgo,
    expiresAt,
    createdAt: d.created_at ?? null, // cursor de paginação
    photos: d.photos ?? [],
  };
}
